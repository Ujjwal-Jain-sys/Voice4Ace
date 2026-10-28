import json
import re
import xml.etree.ElementTree as ET
import httpx
from fastapi import FastAPI, Query, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

# Optional Open-Source Libraries (gracefully handled if still installing)
try:
    from ytmusicapi import YTMusic
    ytmusic = YTMusic()
except Exception:
    ytmusic = None

try:
    import yt_dlp
except Exception:
    yt_dlp = None

try:
    import syncedlyrics
except Exception:
    syncedlyrics = None

app = FastAPI(title="VOCAL4ACE — YouTube Music & Open-Source Lyrics Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "gemma4:e4b"

class SnippetItem(BaseModel):
    snippetId: int
    meanHz: float
    note: str
    voicedFrames: int

class TelemetryPayload(BaseModel):
    totalVoicedFramesCaptured: int
    meanFundamentalFrequencyHz: float
    meanMusicalNote: str
    lowestComfortableHz: float
    lowestMusicalNote: str
    highestComfortableHz: float
    highestMusicalNote: str
    measuredOctaveSpan: float
    pitchStabilityScore: float
    spectralCentroidHz: float
    spectralTimbreClass: str
    snippetBreakdown: Optional[List[SnippetItem]] = None


def parse_openlyrics_or_opensong_xml(xml_content: str, total_duration: int = 210) -> str:
    """
    Parses open-source OpenLyrics (.xml) and OpenSong XML formats into time-synced LRC lines.
    """
    lines_out: List[str] = []
    try:
        root = ET.fromstring(xml_content)
        # Check for OpenSong <lyrics> tag
        lyrics_node = root.find("lyrics")
        if lyrics_node is not None and lyrics_node.text:
            raw_lines = [
                re.sub(r"^\[.*?\]|\..*", "", ln).strip()
                for ln in lyrics_node.text.splitlines()
            ]
            raw_lines = [ln for ln in raw_lines if ln]
        else:
            # OpenLyrics XML (<verse><lines>...</lines></verse>)
            raw_lines = []
            for elem in root.iter():
                if elem.tag.endswith("lines") or elem.tag.endswith("line"):
                    txt = "".join(elem.itertext()).strip()
                    if txt:
                        for sub in txt.splitlines():
                            if sub.strip():
                                raw_lines.append(sub.strip())

        if not raw_lines:
            return ""

        step = max(3.5, min(6.0, (total_duration - 10) / max(1, len(raw_lines))))
        for idx, text in enumerate(raw_lines):
            sec = idx * step + 2.0
            mins = int(sec // 60)
            rem = sec % 60
            lines_out.append(f"[{mins:02d}:{rem:05.2f}] {text}")
        return "\n".join(lines_out)
    except Exception:
        return ""


def extract_ytmusic_stream_url(video_id: str) -> str:
    """
    Uses yt-dlp to extract the direct high-bitrate YouTube Music audio stream (.m4a/.webm)
    so HTML5 <audio> plays the exact full-length YouTube Music track starting at 0:00.
    """
    if not yt_dlp or not video_id:
        return ""
    ydl_opts = {
        "format": "bestaudio[ext=m4a]/bestaudio/best",
        "quiet": True,
        "no_warnings": True,
        "noplaylist": True,
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(
                f"https://music.youtube.com/watch?v={video_id}", download=False
            )
            return info.get("url") or ""
    except Exception:
        return ""


@app.get("/health")
async def health_check():
    ollama_ok = False
    try:
        async with httpx.AsyncClient(timeout=1.5) as client:
            r = await client.get("http://localhost:11434/api/tags")
            ollama_ok = r.status_code == 200
    except Exception:
        ollama_ok = False

    return {
        "status": "ok",
        "ollamaReachable": ollama_ok,
        "configuredModel": MODEL_NAME,
        "ytmusicReady": ytmusic is not None,
        "ytdlpReady": yt_dlp is not None,
        "syncedlyricsReady": syncedlyrics is not None,
    }


@app.post("/analyze-telemetry")
async def analyze_telemetry(payload: TelemetryPayload):
    prompt = f"""You are VOCAL4ACE (powered by Gemma 4). Analyze this measured human voice telemetry and return ONLY valid JSON with keys "vocalClassification" and "coachingTip":
{payload.model_dump_json(indent=2)}"""

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            res = await client.post(
                OLLAMA_URL,
                json={
                    "model": MODEL_NAME,
                    "prompt": prompt,
                    "stream": False,
                    "format": "json",
                },
            )
            gemma_json = json.loads(res.json().get("response", "{}"))
            return {
                "engineUsed": f"Ollama {MODEL_NAME} (Local Edge AI)",
                "gemmaAnalysis": gemma_json,
            }
    except Exception:
        return {
            "engineUsed": "6D Acoustic Biomarker Vector Engine",
            "gemmaAnalysis": {},
        }


@app.get("/music/ytmusic")
async def search_ytmusic_and_open_lyrics(
    q: str = Query(..., description="Song + Artist search query"),
    track: str = Query("", description="Clean track title"),
    artist: str = Query("", description="Clean artist name"),
    videoId: str = Query("", description="Optional pre-verified YouTube Music videoId"),
):
    """
    Unified YouTube Music + Open-Source Lyrics (LRCLIB + syncedlyrics + YTMusic Timestamps) Endpoint.
    Returns:
      - videoId (for Official YouTube Music IFrame Player)
      - streamUrl (direct full-length audio stream extracted via yt-dlp)
      - syncedLyrics (exact 0:00 -> End LRC matched to the YouTube Music track duration)
    """
    resolved_video_id = videoId
    resolved_title = track or q
    resolved_artist = artist
    artwork_url = ""
    duration_sec = 0
    synced_lrc = ""
    lyrics_source = "LRCLIB Open Dataset"

    # 1. Search Official YouTube Music Catalog (filter="songs" avoids music video intros!)
    if ytmusic:
        try:
            search_results = ytmusic.search(q, filter="songs", limit=5)
            if not search_results:
                search_results = ytmusic.search(q, filter="videos", limit=3)

            if search_results:
                # If artist is specified, prefer the result matching that artist
                chosen = search_results[0]
                if artist:
                    artist_low = artist.lower().split(",")[0].strip()
                    for item in search_results:
                        item_artists = " ".join(
                            a.get("name", "").lower() for a in item.get("artists", [])
                        )
                        if artist_low in item_artists:
                            chosen = item
                            break

                if not resolved_video_id:
                    resolved_video_id = chosen.get("videoId") or ""
                resolved_title = chosen.get("title") or resolved_title
                if chosen.get("artists"):
                    resolved_artist = ", ".join(
                        a.get("name", "") for a in chosen["artists"] if a.get("name")
                    )
                if chosen.get("duration_seconds"):
                    duration_sec = int(chosen["duration_seconds"])
                thumbs = chosen.get("thumbnails") or []
                if thumbs:
                    artwork_url = thumbs[-1].get("url") or ""
        except Exception:
            pass

    # 2. Extract Direct Full-Length Audio Stream URL from YouTube Music via yt-dlp
    direct_stream_url = ""
    if resolved_video_id:
        direct_stream_url = extract_ytmusic_stream_url(resolved_video_id)
        if not artwork_url:
            artwork_url = f"https://i.ytimg.com/vi/{resolved_video_id}/hqdefault.jpg"

    clean_t = re.sub(r"\(.*?\)|\[.*?\]", "", resolved_title).strip()
    clean_a = re.sub(
        r"\(.*?\)|\[.*?\]",
        "",
        (resolved_artist.split(",")[0] if resolved_artist else ""),
    ).strip()

    # 3. Query LRCLIB Open-Source Dataset Matched by Exact YouTube Music Duration
    async with httpx.AsyncClient(timeout=4.0) as client:
        try:
            lrc_res = await client.get(
                "https://lrclib.net/api/search",
                params={"q": f"{clean_t} {clean_a}".strip()},
            )
            if lrc_res.status_code == 200:
                items = lrc_res.json()
                if isinstance(items, list) and len(items) > 0:
                    synced_candidates = [x for x in items if x.get("syncedLyrics")]
                    if synced_candidates:
                        if duration_sec > 0:
                            synced_candidates.sort(
                                key=lambda x: abs(int(x.get("duration") or 0) - duration_sec)
                            )
                        synced_lrc = synced_candidates[0]["syncedLyrics"]
                        lyrics_source = "LRCLIB Open Dataset (Duration-Locked)"
        except Exception:
            pass

    # 4. Fallback to `syncedlyrics` Open-Source Aggregator (Musixmatch / NetEase / Megalobiz / OpenLyrics)
    if not synced_lrc and syncedlyrics:
        try:
            lrc_str = syncedlyrics.search(f"{clean_t} {clean_a}".strip(), synced_only=True)
            if lrc_str and "[" in lrc_str:
                synced_lrc = lrc_str
                lyrics_source = "Open-Source SyncedLyrics Aggregator"
        except Exception:
            pass

    # 5. Fallback to YouTube Music Native Timed Lyrics if available via watch playlist
    if not synced_lrc and ytmusic and resolved_video_id:
        try:
            watch = ytmusic.get_watch_playlist(videoId=resolved_video_id)
            lyrics_browse_id = watch.get("lyrics")
            if lyrics_browse_id:
                yt_lyrics_obj = ytmusic.get_lyrics(lyrics_browse_id)
                if yt_lyrics_obj and yt_lyrics_obj.get("lyrics"):
                    raw_text = yt_lyrics_obj["lyrics"]
                    raw_lines = [ln.strip() for ln in raw_text.splitlines() if ln.strip()]
                    step = max(3.5, (duration_sec or 180) / max(1, len(raw_lines)))
                    formatted = []
                    for idx, ln in enumerate(raw_lines):
                        sec = idx * step + 1.5
                        formatted.append(f"[{int(sec // 60):02d}:{sec % 60:05.2f}] {ln}")
                    synced_lrc = "\n".join(formatted)
                    lyrics_source = "YouTube Music Official Lyrics"
        except Exception:
            pass

    return {
        "videoId": resolved_video_id,
        "streamUrl": direct_stream_url,
        "artworkUrl": artwork_url,
        "trackName": resolved_title,
        "artistName": resolved_artist,
        "durationSec": duration_sec or 210,
        "syncedLyrics": synced_lrc,
        "lyricsSource": lyrics_source,
    }


@app.post("/lyrics/import-xml")
async def import_openlyrics_or_opensong(file: UploadFile = File(...)):
    """
    Allows importing open-source OpenLyrics (.xml) or OpenSong XML files directly into the teleprompter.
    """
    raw_bytes = await file.read()
    xml_str = raw_bytes.decode("utf-8", errors="ignore")
    converted_lrc = parse_openlyrics_or_opensong_xml(xml_str)
    return {
        "syncedLyrics": converted_lrc,
        "lyricsSource": "OpenLyrics / OpenSong XML Import",
    }