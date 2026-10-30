"use client"
import { useTRPC } from '@/trcp/client'
import { useSuspenseQuery } from '@tanstack/react-query'
import React from 'react'

const Client = () => {
  const trpc = useTRPC()
  const { data: users } = useSuspenseQuery(trpc.getusers.queryOptions())
  return (
    <div> client component {JSON.stringify(users)}</div>
  )
}

export default Client
