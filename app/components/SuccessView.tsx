import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { playSound } from "@/lib/sound";
import confetti from "canvas-confetti";
import { CheckCircle } from "lucide-react";
import React from "react";

function SuccessView({ name }: { name: string }) {
  React.useEffect(() => {
    // 1. Play the Sound
    playSound("success");

    // 2. Fire the Confetti
    // Fire once from the center
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#10b981", "#059669", "#34d399", "#ffffff"], // Alipio Dental green palette
    });

    // Optional: Fire a second burst from the sides for more "wow"
    const end = Date.now() + 2 * 1000;

    (function frame() {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#10b981", "#ffffff"],
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#10b981", "#ffffff"],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
      <Card className="max-w-md w-full bg-white border-emerald-500 border-t-8 p-10 text-center space-y-8 shadow-2xl rounded-[3rem]">
        <div className="h-24 w-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto animate-bounce">
          <CheckCircle className="h-12 w-12 text-emerald-600" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-zinc-800">
            Awesome, {name.split(" ")[0]}!
          </h2>
          <p className="text-zinc-500 font-medium leading-relaxed">
            Your appointment request has been beamed to our team. We'll text or
            email you to confirm within 24 to 48 hours or less.
          </p>
        </div>
        <Button
          onClick={() => window.location.reload()}
          className="w-full bg-zinc-900 hover:bg-zinc-800 text-white py-8 text-lg font-black rounded-2xl"
        >
          Got it, thanks!
        </Button>
      </Card>
    </div>
  );
}

export default SuccessView;
