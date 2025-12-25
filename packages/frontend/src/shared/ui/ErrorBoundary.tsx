import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = {
  fallback?: ReactNode;
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }

  override render() {
    if (this.state.hasError) {
      const goHome = () => {
        if (typeof window === 'undefined') return;
        const target = window.location.origin;
        window.location.href = target;
      };
      return (
        this.props.fallback ?? (
          <div className="flex min-h-screen w-full items-center justify-center bg-white px-6">
            <div className="w-full max-w-md rounded-3xl border border-red-500/20 bg-red-500/5 p-6 text-center text-[#29292B]">
              <div className="text-[18px] font-semibold">Что-то пошло не так</div>
              <div className="mt-2 text-[14px] text-[#5A5A5C]">
                Мы уже работаем над исправлением. Вернитесь на главный экран и попробуйте снова.
              </div>
              <button
                type="button"
                onClick={goHome}
                className="mt-5 w-full rounded-2xl bg-[#000043] px-4 py-3 text-[14px] font-semibold text-white"
              >
                На главную
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
