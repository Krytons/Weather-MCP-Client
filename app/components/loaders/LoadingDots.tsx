type LoadingDotsProps = {
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

export default function LoadingDots({className = '', size = 'md'} : LoadingDotsProps) {
    const sizeClasses = {
        sm: 'w-1 h-1',
        md: 'w-2 h-2', 
        lg: 'w-3 h-3'
    };
    const dotClass = `${sizeClasses[size]} bg-gray-500 dark:bg-gray-400 rounded-full animate-pulse`;

    return (
        <div className={`flex items-center space-x-1 ${className}`}>
        <div 
            className={`${dotClass}`}
            style={{
            animationDelay: '0ms',
            animationDuration: '1.4s'
            }}
        ></div>
        <div 
            className={`${dotClass}`}
            style={{
            animationDelay: '200ms',
            animationDuration: '1.4s'
            }}
        ></div>
        <div 
            className={`${dotClass}`}
            style={{
            animationDelay: '400ms',
            animationDuration: '1.4s'
            }}
        ></div>
        </div>
    );
};