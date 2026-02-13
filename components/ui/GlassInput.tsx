import { useThemeMode } from "@/app/theme/AutoDarkThemeProvider";

interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    icon?: React.ReactNode;
    label: string;
}

export const GlassInput: React.FC<GlassInputProps> = ({ icon, label, id, className = '', ...props }) => {
    const { mode } = useThemeMode();
    const isDark = mode === 'dark';

    return (
        <div>
            <label
                className={`block text-sm font-medium mb-1 ml-1 transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                htmlFor={id}
            >
                {label}
            </label>
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    {icon && (
                        <span className={`text-lg transition-colors group-focus-within:text-[#FF380B] ${isDark ? 'text-gray-400' : 'text-gray-400'}`}>
                            {icon}
                        </span>
                    )}
                </div>
                <input
                    id={id}
                    className={`appearance-none block w-full pl-10 pr-3 py-3 rounded-lg sm:text-sm transition-all duration-300 
                    outline-none border
                    ${isDark
                            ? 'bg-white/5 border-white/10 text-white placeholder-gray-500'
                            : 'bg-white/60 border-gray-200 text-gray-900 placeholder-gray-400'}
                    focus:border-[#FF380B] focus:ring-1 focus:ring-[#FF380B] 
                    ${className}`}
                    {...props}
                />
            </div>
        </div>
    );
};
