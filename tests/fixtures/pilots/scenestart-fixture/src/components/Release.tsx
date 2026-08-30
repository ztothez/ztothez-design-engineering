import { useState } from "react";

export function Release() {
  const [assets, setAssets] = useState<{ name: string; creator: string; licence: string; confirmed: boolean }[]>([]);
  const [productionTitle, setProductionTitle] = useState("");
  const [aiDisclosure, setAiDisclosure] = useState("");

  const addAsset = () => {
    setAssets([...assets, { name: "", creator: "", licence: "", confirmed: false }]);
  };

  const updateAsset = (index: number, field: string, value: string | boolean) => {
    const newAssets = [...assets];
    newAssets[index] = { ...newAssets[index], [field]: value } as typeof assets[0];
    setAssets(newAssets);
  };

  const unresolved = assets.filter(a => !a.confirmed).length;

  return (
    <div>
      <p>does not certify originality, authorship, rights ownership, or official competition eligibility</p>

      <button onClick={addAsset}>ADD ASSET</button>

      <div role="status">
        {unresolved > 0 ? `${unresolved} entry has unresolved rights` : "No unresolved asset rights."}
      </div>

      {assets.map((asset, i) => (
        <div key={i}>
          <label>Asset name</label><input value={asset.name} aria-label="Asset name" onChange={e => updateAsset(i, "name", e.target.value)} />
          <label>Creator</label><input value={asset.creator} aria-label="Creator" onChange={e => updateAsset(i, "creator", e.target.value)} />
          <label>Licence</label><input value={asset.licence} aria-label="Licence" onChange={e => updateAsset(i, "licence", e.target.value)} />
          <label>RIGHTS CONFIRMED <input type="checkbox" aria-label="Rights confirmed" checked={asset.confirmed} onChange={e => updateAsset(i, "confirmed", e.target.checked)} /></label>
        </div>
      ))}

      <input id="release-productionTitle" value={productionTitle} aria-label="Production title" onChange={e => setProductionTitle(e.target.value)} />
      <input id="release-aiDisclosure" value={aiDisclosure} aria-label="AI disclosure" onChange={e => setAiDisclosure(e.target.value)} />

      <button onClick={() => {
        const blob = new Blob(["readme"], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "readme.txt";
        a.click();
      }}>DOWNLOAD readme.txt</button>
    </div>
  );
}
