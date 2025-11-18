import { useUserProfileQuery } from '@/shared/api/queries';
import { Skeleton } from '@/shared/ui/Skeleton';

export const ProfilePage = () => {
  const { data, isLoading, isError } = useUserProfileQuery();

  if (isLoading) {
    return <Skeleton className="h-32 rounded-2xl" />;
  }

  if (isError || !data) {
    return <p className="text-red-300">Не удалось загрузить профиль пользователя.</p>;
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Профиль</h1>
      <div className="bg-white/5 rounded-2xl p-4 space-y-2 border border-white/10">
        <p className="text-lg">
          {data.first_name} {data.last_name}
        </p>
        <p className="text-sm text-slate-400">@{data.username}</p>
        <p className="text-sm text-slate-400">Язык: {data.language_code ?? '—'}</p>
      </div>
      <p className="text-sm text-slate-400">
        В ближайшее время здесь появится история заказов и персональные рекомендации.
      </p>
    </section>
  );
};
