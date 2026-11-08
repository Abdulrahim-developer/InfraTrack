import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/assets')({
  component: AssetsLayout,
})

function AssetsLayout() {
  return <Outlet />
}
