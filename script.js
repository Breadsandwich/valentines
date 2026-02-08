/* ============================================
   Valentine's Day — Interactive Script
   ============================================ */

;(function () {
  'use strict'

  /* ---- DOM References ---- */
  const questionScene = document.getElementById('question-scene')
  const answerScene = document.getElementById('answer-scene')
  const btnYes = document.getElementById('btn-yes')
  const btnNo = document.getElementById('btn-no')
  const heartBurst = document.getElementById('heart-burst')
  const canvas = document.getElementById('hearts-canvas')
  const ctx = canvas.getContext('2d')

  /* ---- State ---- */
  const FLEE_DISTANCE = 150
  const FLEE_SPEED = 200
  const BUTTON_PADDING = 20
  let hasAnswered = false
  let noButtonPos = { x: 0, y: 0 }

  /* ---- Position the No button at its natural spot ---- */

  function initNoButton() {
    const yesRect = btnYes.getBoundingClientRect()
    const noWidth = btnNo.offsetWidth
    const noHeight = btnNo.offsetHeight

    noButtonPos = {
      x: yesRect.right + 24,
      y: yesRect.top + (yesRect.height - noHeight) / 2,
    }

    btnNo.style.left = noButtonPos.x + 'px'
    btnNo.style.top = noButtonPos.y + 'px'
  }

  /* Position immediately, then refine after fonts load */
  initNoButton()

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      initNoButton()
    })
  }

  /* ---- Floating Hearts (Canvas) ---- */

  const heartColors = [
    'rgba(242, 160, 173, 0.15)',
    'rgba(232, 99, 123, 0.1)',
    'rgba(212, 54, 92, 0.08)',
    'rgba(255, 218, 221, 0.12)',
    'rgba(185, 28, 59, 0.06)',
  ]

  function createFloatingHearts(count) {
    return Array.from({ length: count }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 18 + 8,
      speed: Math.random() * 0.4 + 0.15,
      drift: Math.random() * 0.5 - 0.25,
      opacity: Math.random() * 0.3 + 0.05,
      color: heartColors[Math.floor(Math.random() * heartColors.length)],
      wobblePhase: Math.random() * Math.PI * 2,
      wobbleSpeed: Math.random() * 0.01 + 0.005,
    }))
  }

  let floatingHearts = createFloatingHearts(25)

  function resizeCanvas() {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }

  function drawHeart(x, y, size) {
    ctx.beginPath()
    const topY = y - size * 0.4
    ctx.moveTo(x, y + size * 0.3)
    ctx.bezierCurveTo(x, y, x - size * 0.5, topY, x, topY + size * 0.15)
    ctx.bezierCurveTo(x + size * 0.5, topY, x, y, x, y + size * 0.3)
    ctx.closePath()
    ctx.fill()
  }

  function animateFloatingHearts() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    floatingHearts = floatingHearts.map(function (heart) {
      const nextY = heart.y - heart.speed
      const nextWobblePhase = heart.wobblePhase + heart.wobbleSpeed
      const nextX = heart.x + heart.drift + Math.sin(nextWobblePhase) * 0.3

      const wrappedY = nextY < -30 ? canvas.height + 30 : nextY
      const wrappedX = nextX < -30
        ? canvas.width + 30
        : nextX > canvas.width + 30
          ? -30
          : nextX

      ctx.globalAlpha = heart.opacity
      ctx.fillStyle = heart.color
      drawHeart(wrappedX, wrappedY, heart.size)

      return {
        ...heart,
        x: wrappedX,
        y: wrappedY,
        wobblePhase: nextWobblePhase,
      }
    })

    ctx.globalAlpha = 1
    requestAnimationFrame(animateFloatingHearts)
  }

  resizeCanvas()

  let resizeTimer
  window.addEventListener('resize', function () {
    resizeCanvas()
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(function () {
      floatingHearts = createFloatingHearts(25)
      initNoButton()
    }, 250)
  })

  requestAnimationFrame(animateFloatingHearts)

  /* ---- Yes Button ---- */

  btnYes.addEventListener('click', function () {
    if (hasAnswered) return
    hasAnswered = true
    transitionToAnswer()
  })

  function transitionToAnswer() {
    btnNo.style.display = 'none'
    btnYes.style.transform = 'scale(1)'

    setTimeout(function () {
      questionScene.classList.add('scene-hidden')
    }, 300)

    setTimeout(function () {
      answerScene.classList.remove('scene-hidden')
      answerScene.classList.add('scene-visible')
      spawnHeartBurst()
    }, 800)
  }

  /* ---- Heart Burst Confetti ---- */

  const burstColors = [
    '#F2A0AD', '#E8637B', '#D4365C', '#B91C3B',
    '#FADADD', '#D4A855', '#FFFBFC',
  ]

  function spawnHeartBurst() {
    const count = 40
    const fragment = document.createDocumentFragment()

    for (let i = 0; i < count; i++) {
      const span = document.createElement('span')
      span.className = 'burst-heart'
      span.textContent = '\u2665'
      span.style.left = Math.random() * 100 + '%'
      span.style.top = Math.random() * 40 + 20 + '%'
      span.style.fontSize = Math.random() * 1.5 + 0.8 + 'rem'
      span.style.animationDuration = Math.random() * 2 + 2 + 's'
      span.style.animationDelay = Math.random() * 0.8 + 's'
      span.style.color = burstColors[Math.floor(Math.random() * burstColors.length)]
      fragment.appendChild(span)
    }

    heartBurst.appendChild(fragment)

    setTimeout(function () {
      while (heartBurst.firstChild) {
        heartBurst.removeChild(heartBurst.firstChild)
      }
    }, 5000)
  }

  /* ---- No Button — Smooth Fleeing Behavior ---- */

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value))
  }

  function distanceBetween(x1, y1, x2, y2) {
    const dx = x1 - x2
    const dy = y1 - y2
    return Math.sqrt(dx * dx + dy * dy)
  }

  function fleeFrom(cursorX, cursorY) {
    if (hasAnswered) return

    const rect = btnNo.getBoundingClientRect()
    const btnCenterX = rect.left + rect.width / 2
    const btnCenterY = rect.top + rect.height / 2
    const dist = distanceBetween(cursorX, cursorY, btnCenterX, btnCenterY)

    if (dist > FLEE_DISTANCE) return

    /* Calculate direction away from cursor */
    let dx = btnCenterX - cursorX
    let dy = btnCenterY - cursorY
    const len = Math.sqrt(dx * dx + dy * dy)

    if (len === 0) {
      dx = 1
      dy = 0
    } else {
      dx = dx / len
      dy = dy / len
    }

    /* Move button away */
    const newX = noButtonPos.x + dx * FLEE_SPEED
    const newY = noButtonPos.y + dy * FLEE_SPEED

    /* Clamp to viewport bounds */
    const maxX = window.innerWidth - rect.width - BUTTON_PADDING
    const maxY = window.innerHeight - rect.height - BUTTON_PADDING

    noButtonPos = {
      x: clamp(newX, BUTTON_PADDING, maxX),
      y: clamp(newY, BUTTON_PADDING, maxY),
    }

    /* If clamped into a corner and still close, bounce to the opposite side */
    const newBtnCenterX = noButtonPos.x + rect.width / 2
    const newBtnCenterY = noButtonPos.y + rect.height / 2
    const newDist = distanceBetween(cursorX, cursorY, newBtnCenterX, newBtnCenterY)

    if (newDist < FLEE_DISTANCE * 0.8) {
      noButtonPos = {
        x: clamp(maxX - noButtonPos.x + BUTTON_PADDING, BUTTON_PADDING, maxX),
        y: clamp(maxY - noButtonPos.y + BUTTON_PADDING, BUTTON_PADDING, maxY),
      }
    }

    btnNo.style.left = noButtonPos.x + 'px'
    btnNo.style.top = noButtonPos.y + 'px'
  }

  /* ---- Yes button grows with each No dodge ---- */

  let yesScale = 1

  function growYesButton() {
    if (hasAnswered) return
    yesScale = yesScale * 1.02
    btnYes.style.transform = 'scale(' + yesScale + ')'

    if (yesScale >= 1.1) {
      btnNo.style.display = 'none'
    }
  }

  /* ---- Flee wrapper that also grows the Yes button ---- */

  function fleeAndGrow(cursorX, cursorY) {
    const rect = btnNo.getBoundingClientRect()
    const btnCenterX = rect.left + rect.width / 2
    const btnCenterY = rect.top + rect.height / 2
    const dist = distanceBetween(cursorX, cursorY, btnCenterX, btnCenterY)

    if (dist <= FLEE_DISTANCE) {
      growYesButton()
    }

    fleeFrom(cursorX, cursorY)
  }

  /* Mouse tracking */
  document.addEventListener('mousemove', function (e) {
    fleeAndGrow(e.clientX, e.clientY)
  })

  /* Touch — move nearby touches */
  document.addEventListener('touchmove', function (e) {
    if (e.touches.length > 0) {
      fleeAndGrow(e.touches[0].clientX, e.touches[0].clientY)
    }
  }, { passive: true })

  /* Intercept taps directly on the No button — flee before click fires */
  btnNo.addEventListener('touchstart', function (e) {
    if (hasAnswered) return
    e.preventDefault()

    const touch = e.touches[0]
    growYesButton()

    /* Jump to a random far-away position */
    const rect = btnNo.getBoundingClientRect()
    const maxX = window.innerWidth - rect.width - BUTTON_PADDING
    const maxY = window.innerHeight - rect.height - BUTTON_PADDING

    let pos = {
      x: BUTTON_PADDING + Math.random() * (maxX - BUTTON_PADDING),
      y: BUTTON_PADDING + Math.random() * (maxY - BUTTON_PADDING),
    }

    /* Make sure it lands far from the tap */
    let attempts = 0
    while (
      distanceBetween(touch.clientX, touch.clientY, pos.x + rect.width / 2, pos.y + rect.height / 2) < FLEE_DISTANCE * 2 &&
      attempts < 15
    ) {
      pos = {
        x: BUTTON_PADDING + Math.random() * (maxX - BUTTON_PADDING),
        y: BUTTON_PADDING + Math.random() * (maxY - BUTTON_PADDING),
      }
      attempts++
    }

    noButtonPos = pos
    btnNo.style.left = pos.x + 'px'
    btnNo.style.top = pos.y + 'px'
  })

  /* No button click — show rejection scene (desktop fallback) */
  const rejectScene = document.getElementById('reject-scene')

  btnNo.addEventListener('click', function () {
    if (hasAnswered) return
    hasAnswered = true

    questionScene.classList.add('scene-hidden')
    btnNo.style.display = 'none'
    document.body.classList.add('rejected')

    setTimeout(function () {
      rejectScene.classList.remove('scene-hidden')
      rejectScene.classList.add('scene-visible')
    }, 500)
  })
})()
