"use client"

import JSConfetti from 'js-confetti'

let jsConfetti: JSConfetti | null = null

if (typeof window !== 'undefined') {
  jsConfetti = new JSConfetti()
}

export default jsConfetti