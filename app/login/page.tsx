import Image from 'next/image'
import Link from 'next/link'

export default function Page() {
  return (
    <main>
      <Image src="/globe.svg" alt="Profile" width={100} height={100} />
      <Link href="/">Go to home</Link>
    </main>
  )
} 
