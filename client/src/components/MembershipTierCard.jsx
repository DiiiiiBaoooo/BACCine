import { useState } from "react";
import { Card, CardContent } from "../components/ui/card";
// import { Button } from "../components/ui/button";
// import { Input } from "../components/ui/input";

export default function MembershipTierCard({ tier, color }) {
  const [showDetail, setShowDetail] = useState(false);
  const [minPoints, setMinPoints] = useState(tier.min_points);

  const handleUpdate = () => {
    // Call API cập nhật min_points
    console.log("Update tier", tier.id, "=>", minPoints);
    // fetch(`/api/membershiptiers/${tier.id}`, { ... })
  };

  return (
    <Card
      className={`rounded-2xl shadow-md border-2 cursor-pointer transition hover:shadow-lg`}
      style={{ borderColor: color }}
      onClick={() => setShowDetail(!showDetail)}
    >
      <CardContent className="p-4">
        <h2 className="text-xl font-bold mb-2" style={{ color }}>
          {tier.name}
        </h2>
        <p className="text-gray-600">Min Points: {tier.min_points}</p>

        {showDetail && (
          <div className="mt-4 space-y-2">
            <p className="text-sm text-gray-700">
              <b>Ưu đãi:</b> {tier.benefits}
            </p>

            <div className="flex items-center space-x-2">
              <Input
                type="number"
                value={minPoints}
                onChange={(e) => setMinPoints(e.target.value)}
                className="w-24"
              />
              <Button onClick={handleUpdate}>Cập nhật</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
