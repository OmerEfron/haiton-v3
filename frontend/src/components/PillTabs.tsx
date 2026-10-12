export function PillTabs<T extends string>({ tabs, active, onChange }: {
  tabs: readonly { id: T; label: string }[]
  active?: T
  onChange: (id: T) => void
}) {
  return (
    <>
      {tabs.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={active === id
            ? 'h-8 flex-none rounded-full px-3.5 text-sm bg-ink font-bold text-paper'
            : 'h-8 flex-none rounded-full px-3.5 text-sm border border-sand font-medium text-ink'}
        >
          {label}
        </button>
      ))}
    </>
  )
}
