import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileSignature, BotMessageSquare } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-14 flex items-center bg-card border-b">
        <Link href="#" className="flex items-center justify-center" prefetch={false}>
          <FileSignature className="h-6 w-6 text-primary" />
          <span className="sr-only">Signed!</span>
        </Link>
        <h1 className="ml-4 text-2xl font-bold tracking-tight text-primary">Signed!</h1>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-background">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-headline">
                    Streamline Your Document Workflow
                  </h2>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Welcome to Signed! - the efficient solution for managing and tracking official documents. Ensure your papers reach the right office, every time.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg">
                    <Link href="/login" prefetch={false}>
                      Sign In
                    </Link>
                  </Button>
                  <Button asChild variant="secondary" size="lg">
                     <Link href="/signup" prefetch={false}>
                      Create Account
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="hidden lg:flex items-center justify-center">
                 <BotMessageSquare className="h-48 w-48 text-primary/30" strokeWidth={1} />
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-card">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">Key Features</div>
                <h3 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">How It Works</h3>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our platform provides a seamless experience for document submission, tracking, and approval.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 lg:gap-16 mt-12">
              <div className="grid gap-1 text-center">
                <h4 className="text-lg font-bold">User Authentication</h4>
                <p className="text-sm text-muted-foreground">
                  Secure sign-up and login with role selection to get you started quickly.
                </p>
              </div>
              <div className="grid gap-1 text-center">
                <h4 className="text-lg font-bold">Document Tracking</h4>
                <p className="text-sm text-muted-foreground">
                  Real-time status updates on your documents, just like tracking a package.
                </p>
              </div>
              <div className="grid gap-1 text-center">
                <h4 className="text-lg font-bold">Admin Management</h4>
                <p className="text-sm text-muted-foreground">
                  Admins can manage offices, users, and roles to keep the system organized and secure.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2024 Signed!. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Terms of Service
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
