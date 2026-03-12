'use client'

import { Button } from '@/components/ui/button'
import { Home, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function NotFound() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-4 py-12 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="space-y-6"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6, type: 'spring', bounce: 0.4 }}
          className="relative mx-auto w-fit"
        >
          <span className="text-[8rem] font-bold leading-none tracking-tight text-primary sm:text-[12rem]">
            404
          </span>
          <motion.div
            animate={{
              y: [0, -8, 0],
              rotate: [0, -5, 5, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 1,
            }}
            className="absolute -right-4 -top-2 sm:-right-8 sm:-top-4"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold shadow-lg sm:h-14 sm:w-14 sm:text-2xl">
              ?
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="space-y-2"
        >
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Page not found
          </h1>
          <p className="mx-auto max-w-md text-muted-foreground">
            Oops! The page you&apos;re looking for seems to have wandered off.
            Let&apos;s get you back on track.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="flex flex-col gap-3 sm:flex-row sm:justify-center"
        >
          <Button asChild size="lg" className="gap-2">
            <Link href="/">
              <Home className="h-4 w-4" />
              Go home
            </Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => window.history.back()}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Go back
          </Button>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -4, 0],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.15,
                ease: 'easeInOut',
              }}
              className="h-2 w-2 rounded-full bg-primary/40"
            />
          ))}
        </div>
      </motion.div>
    </div>
  )
}
