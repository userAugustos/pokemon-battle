import index from './index.html'
import './game.machine'

function apiRes(res: any) {
  return new Response(JSON.stringify(res), {
    headers: {
      'Content-Type': 'application/json'
    },
  })
}

Bun.serve({
  routes: {
    "/": index,
    "/api/health": {
      GET: () => apiRes({ message: 'Api is up!' })
    }
   },
  development: {
    hmr: true,
    console: true
  }
})
