'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const nav = [
  { href: '/responsavel/dashboard',      icon: '📡', label: 'Painel' },
  { href: '/responsavel/configuracoes',  icon: '⚙️', label: 'Configurações' },
  { href: '/responsavel/relatorio',      icon: '📈', label: 'Relatório' },
]

export default function ResponsavelLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 flex-shrink-0 border-r border-white/8 flex flex-col bg-surface2 fixed h-full z-10">
        <div className="flex items-center gap-2 px-5 py-5 border-b border-white/8">
          <div className="w-2 h-2 rounded-full bg-accent2 shadow-[0_0_8px_#7F77DD]" />
          <span className="font-display font-bold text-sm tracking-tight">FocoENEM</span>
        </div>
        <nav className="flex-1 py-4 px-3 flex flex-col gap-1">
          {nav.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                pathname === item.href
                  ? 'bg-accent2/10 text-accent2 font-medium'
                  : 'text-muted hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-3 pb-4 border-t border-white/8 pt-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted hover:text-danger hover:bg-danger/5 transition-all"
          >
            <span>🚪</span> Sair
          </button>
        </div>
      </aside>
      <main className="flex-1 ml-56 p-6 min-h-screen">
        {children}
      </main>
    </div>
  )
}
