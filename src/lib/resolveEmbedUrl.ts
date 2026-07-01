export function resolveEmbedUrl(url: string): string | null {
  try {
    if (url.includes('youtube.com/watch')) {
      const v = new URL(url).searchParams.get('v')
      return v ? `https://www.youtube.com/embed/${v}` : null
    }
    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1]?.split('?')[0]
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
    if (url.includes('vimeo.com/')) {
      const path  = url.split('vimeo.com/')[1]?.split('?')[0] ?? ''
      const parts = path.split('/')
      const videoId = parts[0]
      const hash    = parts[1]
      if (!videoId) return null
      return hash
        ? `https://player.vimeo.com/video/${videoId}?h=${hash}&badge=0&autopause=0&player_id=0`
        : `https://player.vimeo.com/video/${videoId}?badge=0&autopause=0&player_id=0`
    }
    if (url.includes('loom.com/share/')) {
      const afterShare = url.split('loom.com/share/')[1] ?? ''
      const [id, qs]   = afterShare.split('?')
      if (!id) return null
      const params = new URLSearchParams(qs ?? '')
      params.set('hide_owner', 'true')
      params.set('hide_share', 'true')
      return `https://www.loom.com/embed/${id}?${params.toString()}`
    }
    if (url.includes('drive.google.com/file/d/')) {
      const fileId = url.split('/file/d/')[1]?.split('/')[0]
      return fileId ? `https://drive.google.com/file/d/${fileId}/preview` : null
    }
    return null
  } catch {
    return null
  }
}
