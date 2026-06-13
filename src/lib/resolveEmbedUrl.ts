export function resolveEmbedUrl(url: string): string | null {
  try {
    // YouTube
    if (url.includes('youtube.com/watch')) {
      const v = new URL(url).searchParams.get('v')
      return v ? `https://www.youtube.com/embed/${v}` : null
    }
    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1]?.split('?')[0]
      return id ? `https://www.youtube.com/embed/${id}` : null
    }

    // Vimeo
    if (url.includes('vimeo.com/')) {
      const path = url.split('vimeo.com/')[1]?.split('?')[0] ?? ''
      const [vid, hash] = path.split('/')
      if (!vid) return null
      return hash
        ? `https://player.vimeo.com/video/${vid}?h=${hash}&badge=0&autopause=0&player_id=0`
        : `https://player.vimeo.com/video/${vid}?badge=0&autopause=0&player_id=0`
    }

    // Loom
    if (url.includes('loom.com/share/')) {
      const id = url.split('loom.com/share/')[1]?.split('?')[0]
      return id ? `https://www.loom.com/embed/${id}?hide_owner=true&hide_share=true&hide_title=true` : null
    }

    // Google Drive — /file/d/{id}/ format
    if (url.includes('drive.google.com/file/d/')) {
      const fid = url.split('/file/d/')[1]?.split('/')[0]
      return fid ? `https://drive.google.com/file/d/${fid}/preview` : null
    }

    // Google Drive — open?id= format (older share links)
    if (url.includes('drive.google.com/open')) {
      const id = new URL(url).searchParams.get('id')
      return id ? `https://drive.google.com/file/d/${id}/preview` : null
    }

    // Google Sheets
    if (url.includes('docs.google.com/spreadsheets/d/')) {
      const id = url.split('/spreadsheets/d/')[1]?.split('/')[0]
      return id ? `https://docs.google.com/spreadsheets/d/${id}/preview` : null
    }

    // Google Docs
    if (url.includes('docs.google.com/document/d/')) {
      const id = url.split('/document/d/')[1]?.split('/')[0]
      return id ? `https://docs.google.com/document/d/${id}/preview` : null
    }

    // Google Slides
    if (url.includes('docs.google.com/presentation/d/')) {
      const id = url.split('/presentation/d/')[1]?.split('/')[0]
      return id ? `https://docs.google.com/presentation/d/${id}/embed?start=false&loop=false` : null
    }

    return null
  } catch { return null }
}
