import FestivalRegisterForm from '../../features/registration/FestivalRegisterForm';

export default function AnmeldungPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#460b6c] bg-cover bg-no-repeat">
      <FestivalRegisterForm setCookies={false} />
    </div>
  );
}