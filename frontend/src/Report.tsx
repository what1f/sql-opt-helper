import React from "react";
import {Table, TableHeader, TableColumn, TableBody, TableRow, TableCell} from "@nextui-org/react";


export interface Record {
  threads: number,
  min: string,
  max: string,
  avg: string,
  p95: string,
  p99: string
}

export  function Report({records, description}: {
  records: Record[],
  description: string,
}) {
  const columns = ["Threads", "Min", "Max", "Avg", "P95", "P99"].map((name, i) => <TableColumn key={i}>{name}</TableColumn>)

  const rows = records.map((record, i) => {
    return (
      <TableRow key={i}>
        <TableCell>{record.threads}</TableCell>
        <TableCell>{record.min}</TableCell>
        <TableCell>{record.max}</TableCell>
        <TableCell>{record.avg}</TableCell>
        <TableCell>{record.p95}</TableCell>
        <TableCell>{record.p99}</TableCell>
      </TableRow>
    )
  })

  return (
    <div className="w-full flex flex-col gap-2">
      <h2 className="text-default-500 text-lg">{description}</h2>
      <Table aria-label="Benchmark sql result">
        <TableHeader>
          {columns}
        </TableHeader>
        <TableBody>
          {rows}
        </TableBody>
      </Table>
    </div>

)
  ;
}
