import { useMemo } from "react";

type MetadataValue = string | number | boolean | null | MetadataRecord | MetadataValue[];

type MetadataRecord = Record<string, MetadataValue>;

interface MetadataViewProps {
  data: Record<string, unknown>;
}

const primitiveToString = (value: Exclude<MetadataValue, MetadataRecord | MetadataValue[]>) => {
  if (value === null || value === undefined) {
    return "—";
  }
  if (typeof value === "boolean") {
    return value ? "True" : "False";
  }
  return String(value);
};

const MetadataList = ({ values }: { values: MetadataValue[] }) => (
  <ul className="metadata-list">
    {values.map((item, index) => (
      <li key={index}>{renderMetadataValue(item)}</li>
    ))}
  </ul>
);

const MetadataTable = ({ data }: { data: MetadataRecord }) => (
  <table className="metadata-table">
    <tbody>
      {Object.entries(data).map(([key, value]) => (
        <tr key={key}>
          <th scope="row">{key}</th>
          <td>{renderMetadataValue(value)}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

const renderMetadataValue = (value: MetadataValue): JSX.Element => {
  if (Array.isArray(value)) {
    return <MetadataList values={value} />;
  }

  if (value && typeof value === "object") {
    return <MetadataTable data={value} />;
  }

  return <>{primitiveToString(value)}</>;
};

const coerceValue = (value: unknown): MetadataValue => {
  if (Array.isArray(value)) {
    return value.map((item) => coerceValue(item));
  }

  if (value && typeof value === "object") {
    return coerceRecord(value as Record<string, unknown>);
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value === null) {
    return value;
  }

  return value === undefined ? null : String(value);
};

const coerceRecord = (record: Record<string, unknown>): MetadataRecord => {
  const result: MetadataRecord = {};
  for (const [key, value] of Object.entries(record)) {
    result[key] = coerceValue(value);
  }
  return result;
};

function MetadataView({ data }: MetadataViewProps) {
  const coerced = useMemo(() => coerceRecord(data), [data]);
  return (
    <div className="metadata-view">
      <MetadataTable data={coerced} />
    </div>
  );
}

export default MetadataView;
