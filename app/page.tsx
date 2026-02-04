'use client'
 
import { useSearchParams } from 'next/navigation'
 
export default function SortProducts() {
  const searchParams = useSearchParams()
 
  function updateSorting(sortOrder: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', sortOrder)
    window.history.pushState(null, '', `?${params.toString()}`)
  }
 
  return (
    <>
      <button onClick={() => updateSorting('asc')}>Sort Ascending</button>
      <button onClick={() => updateSorting('desc')}>Sort Descending</button>
    </>
  )
}


/*
import Image from 'next/image'
import Link from 'next/link'

export default function Page() {
  return (
    <main>
      <Image src="/vctlogo.png" alt="Profile" width={100} height={100} />
      <Link href="/login">Go to login</Link>
    </main>
  )
} 
*/