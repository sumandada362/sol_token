const PINATA_API = "https://api.pinata.cloud";

export interface TokenMetadataJson {
  name: string;
  symbol: string;
  description?: string;
  image: string; // IPFS URI of the logo
  extensions?: {
    website?: string;
    twitter?: string;
    telegram?: string;
  };
}

export async function uploadFileToPinata(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  form.append(
    "pinataMetadata",
    JSON.stringify({ name: `token-logo-${Date.now()}.${file.name.split(".").pop()}` })
  );
  form.append("pinataOptions", JSON.stringify({ cidVersion: 1 }));

  const res = await fetch(`${PINATA_API}/pinning/pinFileToIPFS`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.PINATA_JWT}` },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pinata file upload failed: ${text}`);
  }

  const data = await res.json();
  return `https://ipfs.io/ipfs/${data.IpfsHash}`;
}

export async function uploadMetadataToPinata(metadata: TokenMetadataJson): Promise<string> {
  const res = await fetch(`${PINATA_API}/pinning/pinJSONToIPFS`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PINATA_JWT}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      pinataContent: metadata,
      pinataMetadata: { name: `${metadata.symbol}-metadata-${Date.now()}.json` },
      pinataOptions: { cidVersion: 1 },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pinata JSON upload failed: ${text}`);
  }

  const data = await res.json();
  return `https://ipfs.io/ipfs/${data.IpfsHash}`;
}
