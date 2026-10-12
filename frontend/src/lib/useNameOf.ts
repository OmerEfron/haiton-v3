import { useConnections } from '../api/queries'

export function useNameOf(): (id: string) => string | undefined {
  const people = useConnections().data ?? []
  return (id) => people.find((p) => p.id === id)?.name
}
