export interface AlertInfo {
  message: string,
  level: undefined | null | '' | 'info' | 'warning' | 'error'
}

export default function Alert({info }: {
  info: AlertInfo;
}) {
  let style = ''
  if (info.level === 'warning') {
    style = 'bg-warning-800 text-warning'
  } else if (info.level === 'error') {
    style = 'bg-danger-800 text-danger'
  }

  return (
    <div className={`${style} fixed bottom-4 right-4 px-4 py-3 rounded-xl shadow-lg transition-opacity duration-500 fade-out`}>
      <span className="block sm:inline">{info.message}</span>
    </div>
  );
}