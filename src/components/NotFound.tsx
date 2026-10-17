import { motion, useReducedMotion } from 'motion/react';
import { Home, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { resolveBackTarget } from './not-found.policy';

export interface NotFoundProps {
  /**
   * True when rendered inside the app shell (sidebar / header already on screen):
   * the page fills its slot instead of the whole viewport. STATE.17 wants the
   * 404 inside the shell, so a catch-all under a layout route should pass this.
   */
  inShell?: boolean;
  /** Where the primary action goes: the home or, better, the collection the missing page belonged to. Defaults to "/". */
  homeHref?: string;
}

// Copy lives under `notFound.{title,body,home,back}`. The English defaults below
// are a safety net for apps whose catalog patch has not shipped these keys yet:
// a missing key must never render as the raw "notFound.title".
const FALLBACK = {
  title: 'Page not found',
  body: "This page doesn't exist or was removed.",
  home: 'Go to home',
  back: 'Go back',
} as const;

/**
 * 404 page. All copy is translatable (no hardcoded strings, no "Oops").
 *
 * @example
 * // In your router
 * { path: '*', element: <NotFound inShell /> }
 */
export function NotFound({ inShell = false, homeHref = '/' }: NotFoundProps = {}) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  // Infinite loops (bounce, rotation) are decorative: off for users who ask for less motion.
  const reduceMotion = useReducedMotion();

  // No history to go back to (deep link / new tab): fall back to the home target.
  const goBack = () => {
    const target = resolveBackTarget(window.history.length, homeHref);
    if (typeof target === 'number') navigate(target);
    else navigate(target);
  };

  // Outside the shell this page IS the document's main landmark; inside it the shell
  // already owns <main>, so a second one would be invalid: use a labelled section.
  const Root = inShell ? 'section' : 'main';

  return (
    <Root data-vid="nd4g9c2"
      aria-labelledby="not-found-title"
      className={cn(
        'flex items-center justify-center p-4',
        inShell
          ? 'min-h-[60vh] w-full'
          : 'min-h-screen bg-gradient-to-br from-background via-background to-muted/20',
      )}
      data-testid="not-found"
    >
      <motion.div data-vid="379pelf"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full text-center space-y-8"
      >
        {/* Animated 404 */}
        <motion.div data-vid="8h13xr8"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6, type: "spring" }}
          className="relative"
        >
          <motion.div data-vid="4wncohb"
            animate={reduceMotion ? undefined : { y: [0, -10, 0] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            aria-hidden="true"
            className="text-[120px] md:text-[180px] font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent leading-none"
          >
            404
          </motion.div>
          
          {/* Floating elements (decorative loops: not rendered under reduced motion) */}
          {!reduceMotion && (
            <>
          <motion.div data-vid="ow16lpi"
            animate={{
              rotate: [0, 360],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute top-0 right-1/4 w-16 h-16 border-2 border-primary/20 rounded-full"
          />
          <motion.div data-vid="amexc9x"
            animate={{
              rotate: [360, 0],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute bottom-0 left-1/4 w-12 h-12 border-2 border-primary/20 rounded-full"
          />
            </>
          )}
        </motion.div>

        {/* Content */}
        <motion.div data-vid="pk874a3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="space-y-4"
        >
          <h1 data-vid="pjioss1" id="not-found-title" className="text-3xl md:text-4xl font-bold text-foreground">
            {t('notFound.title', FALLBACK.title)}
          </h1>
          <p data-vid="1kdd7kr" className="text-lg text-muted-foreground max-w-md mx-auto">
            {t('notFound.body', FALLBACK.body)}
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div data-vid="xxsdlsk"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Button data-vid="9xnojds"
            size="lg"
            onClick={() => navigate(homeHref)}
            className="gap-2 min-w-[160px]"
          >
            <Home data-vid="ctj4r5s" className="w-4 h-4" />
            {t('notFound.home', FALLBACK.home)}
          </Button>
          
          <Button data-vid="m4qjesn"
            size="lg"
            variant="outline"
            onClick={goBack}
            className="gap-2 min-w-[160px]"
          >
            <ArrowLeft data-vid="kxw658j" className="w-4 h-4" />
            {t('notFound.back', FALLBACK.back)}
          </Button>
        </motion.div>
      </motion.div>
    </Root>
  );
}

