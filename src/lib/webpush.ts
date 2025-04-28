import webpush from 'web-push'

webpush.setVapidDetails(
  'mailto:vapid@hey.fansel.dev',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export { webpush } 