import { HeadContent, Scripts, createRootRoute, useLocation, useNavigate } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import appCss from '../styles.css?url'
import { createExecutor, executeAll } from '#/core/executor.ts';
import { VoiceButton } from '#/components/voiceButton.tsx';
import type { VoiceCommandContext } from '#/types/voice.ts';
import { z } from 'zod';

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Frocus',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
})


const voiceContext: VoiceCommandContext = {
  language: "ne",
  routes: [
    { path: "/", name: "Landing" },
    { path: "/download", name: "Download" }
  ],
  actions: {
    current_route: z.object({}).describe("Log the current route")
  }
}

function RootDocument({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const executor = createExecutor({
    navigate: (path) => navigate({ to: path }),
    forms: {
    },
    actions: {
      current_route: () => console.log("Current route is: ", pathname)
    }
  })

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <VoiceButton className="absolute bottom-0 right-0 p-4" context={voiceContext} onCommand={async (result) => await executeAll(result.command, executor)} ></VoiceButton>
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
