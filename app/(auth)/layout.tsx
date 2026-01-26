export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-aero-slate-50 dark:bg-aero-slate-900">
      {children}
    </div>
  )
}
