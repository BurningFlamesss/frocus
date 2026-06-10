import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/download/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div>
      Download the app from here: LINK
      <br />
      Download the extension from here: LINK
    </div>
  )
}
