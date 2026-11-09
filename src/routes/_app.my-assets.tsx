import { createFileRoute } from '@tanstack/react-router'
import MyAssignedAssets from '#/features/assets/components/MyAssignedAssets'

export const Route = createFileRoute('/_app/my-assets')({
  component: MyAssignedAssets,
})
