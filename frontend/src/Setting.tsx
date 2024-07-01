import React, { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
  Input,
  Tooltip
} from "@nextui-org/react";
import {SettingTwo} from "@icon-park/react";
import {toNumbers} from "./assets/utils";
import {InitDB, TestConnection} from "../wailsjs/go/backend/Benchmark";

export interface Config {
  path: string,
  username: string,
  password: string,
  database: string,
  threads: string,
  iterations: number
}

function toConfigReq(config: Config) {
  const threads = toNumbers(config.threads);
  return {
    ...config,
    threads: threads,
    driver: 'mysql'
  }
}

interface AlertInfo {
  content: string,
  level: "" | "warning" | "danger"
}

export function Setting({conf, onSave}: {conf: Config|null, onSave: (config: Config) => void}) {
  const {isOpen, onOpen, onOpenChange} = useDisclosure();
  const [config, setConfig] = useState<Config>(conf ? conf : {
    path: '',
    username: '',
    password: '',
    database: '',
    threads: '',
    iterations: 1,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [testLoading, setTestLoading] = useState<boolean>(false);

  const [alert, setAlert] = useState<AlertInfo|null>(null);
  const [msg, setMsg] = useState("");

  function handleError(err: any) {
    setAlert({
      content: err.toString(),
      level: "danger"
    });
  }

  function save(close: () => void) {
    let req;
    try {
      req = toConfigReq(config);
    } catch (err) {
      handleError(err);
      return;
    }
    setLoading(true);
    InitDB(req).then(() => {
      onSave(config);
      close();
    })
      .catch(handleError)
      .finally(() => setLoading(false));
  }

  function testConnection() {
    let req;
    try {
      req = toConfigReq(config);
    } catch (err) {
      handleError(err);
      return;
    }
    setTestLoading(true);
    TestConnection(req).then(() => {
      setMsg("Connect successfully!");
      setAlert(null);
      setTimeout(() => setMsg(""), 3000);
    })
      .catch(handleError)
      .finally(() => setTestLoading(false));
  }



  return (
    <>
      <Button size="lg" className="ml-auto bg-zinc-700" isIconOnly onPress={onOpen}><SettingTwo size="24" fill="#18181B"/></Button>
      <Modal 
        isOpen={isOpen} 
        onOpenChange={onOpenChange}
        placement="top-center"
        size="lg"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Database Setting</ModalHeader>
              <ModalBody>
                <Input
                  autoFocus
                  label="Host:Port"
                  placeholder="localhost:3306"
                  variant="bordered"
                  value={config.path}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                  onChange={(e) => setConfig({...config, path: e.target.value})}
                />
                <Input
                  label="Username"
                  placeholder="root"
                  variant="bordered"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                  value={config.username}
                  onChange={(e) => setConfig({...config, username: e.target.value})}
                />

                <Input
                  label="Password"
                  placeholder="Enter your database password"
                  type="password"
                  variant="bordered"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                  value={config.password}
                  onChange={(e) => setConfig({...config, password: e.target.value})}
                />
                <Input
                  label="Database"
                  placeholder="Enter your database name"
                  variant="bordered"
                  autoComplete="off"
                  autoCorrect="off"
                  value={config.database}
                  onChange={(e) => setConfig({...config, database: e.target.value})}
                />
                <div className="flex flex-row justify-center items-center gap-2">
                  <Tooltip content="Number of threads executing">
                    <Input label="Threads"
                           placeholder="Such as 1,10,100"
                           variant="bordered"
                           value={config.threads}
                           onChange={(e) => setConfig({...config, threads: e.target.value})}
                    />
                  </Tooltip>
                  <Tooltip content="The count of SQL statement executions(number only)">
                    <Input label="Iterations"
                           variant="bordered"
                           type="number"
                           placeholder="Iterations"
                           value={config.iterations.toString()}
                           onChange={(e) => setConfig({...config, iterations: Number(e.target.value)})}
                    />
                  </Tooltip>
                </div>
              </ModalBody>
              <ModalFooter className="flex flex-col gap-2">
                {alert && <Alert info={alert} onClose={() => setAlert(null)}/>}
                <div className="flex flex-row gap-2">
                  {msg && <p className="text-success">{msg}</p>}
                  <Button color="primary" className="ml-auto" isLoading={testLoading} onClick={testConnection}>Test Connection</Button>
                  <Button color="success" onPress={() => save(onClose)} isLoading={loading}>Save</Button>
                </div>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}

const Alert = ({ info, onClose } : {
  info: AlertInfo,
  onClose: () => void
}) => {
  const contentColor = info.level === 'danger' ? 'text-danger' : 'text-warning';
  const bgColor = info.level === 'danger' ? 'bg-danger-800' : 'bg-warning-800';
  return (
    <Tooltip content={info.content}>
      <div
        className={`${bgColor} ${contentColor} rounded px-4 py-3 relative line-clamp-2`}
      >
        <span className="block sm:inline">{info.content}</span>
        <span className="absolute top-0 bottom-0 right-0 px-4 py-3">
        <svg
          className={`fill-current h-6 w-6 ${contentColor}`}
          role="button"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          onClick={onClose}
        >
          <title>Close</title>
          <path
            d="M14.348 14.849a.5.5 0 0 1-.707 0L10 11.207l-3.642 3.642a.5.5 0 1 1-.707-.707L9.293 10.5 5.651 6.858a.5.5 0 1 1 .707-.707L10 9.793l3.642-3.642a.5.5 0 1 1 .707.707L10.707 10.5l3.642 3.642a.5.5 0 0 1 0 .707z"/>
        </svg>
      </span>
      </div>
    </Tooltip>
  );
};
