import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Header } from './header'
import { Footer } from './footer'
import { ContactModal } from '../sections/contact-modal'
import { CaptchaModal } from '../sections/captcha-modal'
import { Toast } from '../ui/toast'
import { useContactForm } from '../../hooks/use-contact-form'

export type ContactOutletContext = ReturnType<typeof useContactForm>

export function RootLayout() {
  const { pathname } = useLocation()
  const contactForm = useContactForm()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <>
      <div className="app-shell">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-accent focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to main content
        </a>

        <Header onContactClick={contactForm.openContactModal} />

        <main id="main-content" className="px-4 py-10 md:px-6 md:py-12">
          <Outlet context={contactForm} />
        </main>

        <Footer onContactClick={contactForm.openContactModal} />
      </div>

      <ContactModal
        open={contactForm.showContactModal}
        onClose={contactForm.closeContactModal}
        onSubmit={contactForm.handleContactSubmit}
        showCaptcha={contactForm.showCaptchaModal}
        onConfirmSend={contactForm.submitVerified}
        sending={contactForm.sending}
        error={contactForm.error}
        turnstileToken={contactForm.turnstileToken}
        captchaStatus={contactForm.captchaStatus}
      />

      <CaptchaModal
        open={contactForm.showCaptchaModal && !contactForm.showContactModal}
        onClose={contactForm.closeCaptchaModal}
        onConfirm={contactForm.submitVerified}
        sending={contactForm.sending}
        turnstileToken={contactForm.turnstileToken}
        captchaStatus={contactForm.captchaStatus}
      />

      <Toast
        visible={contactForm.sent}
        message="Thanks — your request has been sent successfully!"
        variant="success"
        onDismiss={contactForm.dismissSent}
      />
    </>
  )
}
