import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "@/contexts/LanguageContext";

export function EmptyState() {
  const { t } = useTranslation();

  return (
    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white shadow-lg flex items-center justify-center">
          <ChatBubbleLeftRightIcon className="w-10 h-10 text-emerald-500" />
        </div>
        <h3 className="text-xl font-semibold text-slate-700 mb-2">{t('select_conversation')}</h3>
        <p className="text-slate-500">{t('select_user_hint')}</p>
      </div>
    </div>
  );
}
