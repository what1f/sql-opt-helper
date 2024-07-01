import {useState} from "react";
import {Config, Setting} from "./Setting";
import {Button, Textarea, Tooltip} from "@nextui-org/react";
import {Report} from "./Report";
import {Run} from "../wailsjs/go/backend/Benchmark";
import {toNumbers} from "./assets/utils";
import Alert, {AlertInfo} from "./components/Alert";


interface TestResult {
  min: number,
  max: number,
  avg: number,
  p95: number,
  p99: number,
}

const mockBaseResult = [
  {min: 89, max: 157, avg: 120, p95: 123, p99: 134},
  {min: 89, max: 157, avg: 120, p95: 123, p99: 134},
  {min: 89, max: 157, avg: 120, p95: 123, p99: 134},
]

const mockOptResult = [
  {min: 59, max: 157, avg: 60, p95: 123, p99: 134},
  {min: 49, max: 157, avg: 40, p95: 123, p99: 134},
  {min: 29, max: 157, avg: 20, p95: 123, p99: 134},
]

function toRecord(threads: number, unit: string, result: TestResult) {
  return {
    threads: threads,
    min: result.min + unit,
    max: result.max + unit,
    avg: result.avg + unit,
    p95: result.p95 + unit,
    p99: result.p99 + unit,
  }
}

function toRecords(results: TestResult[], threads: number[], unit: string) {
  return results.map((result, i) => {
    return toRecord(threads[i], unit, result);
  })
}

function compareResults(base: TestResult[], opt: TestResult[], threads: number[]) {
  return base.map((base, idx) => {
    return toRecord(threads[idx], "X", {
      min: Math.round(base.min / opt[idx].min * 10) / 10,
      max: Math.round(base.max / opt[idx].max * 10) / 10,
      avg: Math.round(base.avg / opt[idx].avg * 10) / 10,
      p95: Math.round(base.p95 / opt[idx].p95 * 10) / 10,
      p99: Math.round(base.p99 / opt[idx].p99 * 10) / 10,
    })
  })
}

function storeSetting(config: Config) {
  localStorage.setItem("setting", JSON.stringify(config))
}

function loadSetting() {
  const setting = localStorage.getItem("setting");
  return setting ? JSON.parse(setting) : null;
}

export function Console() {
  const [setting, setSetting] = useState<Config>(loadSetting());


  function saveSetting(conf: Config) {
    setSetting(conf);
    storeSetting(conf);
  }

  const [preSQL, setPreSQL] = useState<string>('');
  const [optSQL, setOptSQL] = useState<string>('');

  const [oldResults, setOldResults] = useState<TestResult[] | null>(null);
  const [newResults, setNewResults] = useState<TestResult[] | null>(null);

  const [oldRecordLoading, setOldRecordLoading] = useState<boolean>(false);
  const [newRecordLoading, setNewRecordLoading] = useState<boolean>(false);

  const [alertInfo, setAlertInfo] = useState<AlertInfo | null>(null);

  function handleError(err: any) {
    setAlertInfo({
      message: err.toString(),
      level: 'error'
    });
    setTimeout(() => {
      setAlertInfo(null);
    }, 5000)
  }

  const record = (query: string, loadingFunc: (value: boolean) => void, setResults: (results: TestResult[] | null) => void) => {
    loadingFunc(true);
    Run(query).then((res) => {
      setResults(res);
    }).catch(handleError)
      .finally(() => loadingFunc(false))
  }

  const generateReport = () => {
    if (!oldResults) {
      record(preSQL, setOldRecordLoading, setOldResults);
    }
    record(optSQL, setNewRecordLoading, setNewResults);
  }

  return (
    <main className="p-12 flex flex-col items-center justify-center w-full space-y-8 max-w-[1280px]">
      <header className="flex gap-4 w-full flex-row relative flex-nowrap items-center justify-between">
          <h1 className="text-default-500 text-4xl font-bold">SQL Optimize Helper</h1>
          <Setting conf={setting} onSave={saveSetting} />
      </header>

      <div className="flex w-full flex-row items-center justify-between gap-4">
        <section className="flex flex-col gap-4 items-center justify-center w-1/2">
          <Textarea
            minRows={8}
            variant="faded"
            label="Original SQL"
            placeholder="Enter your original SQL statement before optimization"
            className="max-w-full"
            autoComplete="off"
            autoCorrect="off"
            onChange={(e) => setPreSQL(e.target.value)}
          />
          <div className="ml-auto">
            <Tooltip content="Save the pre-optimization SQL report">
              <Button size="lg" color="primary" isLoading={oldRecordLoading} onClick={() => record(preSQL, setOldRecordLoading, setOldResults)}>Record</Button>
            </Tooltip>
          </div>
        </section>
        <section className="flex flex-col items-center justify-center gap-4 w-1/2">
          <Textarea
            minRows={8}
            variant="faded"
            label="Current SQL"
            placeholder="Enter your optimized SQL statement"
            className="max-w-full"
            autoComplete="off"
            autoCorrect="off"
            onChange={(e) => setOptSQL(e.target.value)}
          />
          <div className="flex gap-4 items-center justify-center ml-auto">
            <Tooltip content="Clear the SQL report">
              <Button size="lg" color="danger" onClick={() => {setOldResults(null); setNewResults(null)}}>Clear Report</Button>
            </Tooltip>
            <Tooltip content="Generate SQL performance comparison report">
              <Button size="lg" className="ml-auto" color="success" isLoading={newRecordLoading}
                      onClick={generateReport}>Generate Report</Button>
            </Tooltip>
          </div>
        </section>
      </div>
      {oldResults && <Report records={toRecords(oldResults, toNumbers(setting.threads), "ms")} description="Original SQL performance report"/>}
      {newResults && <Report records={toRecords(newResults, toNumbers(setting.threads), "ms")} description="Optimized SQL performance report"/>}
      {oldResults && newResults && <Report records={compareResults(oldResults, newResults, toNumbers(setting.threads))} description="Performance contrast report"/>}
      {alertInfo && <Alert info={alertInfo} />}
    </main>
  )
}