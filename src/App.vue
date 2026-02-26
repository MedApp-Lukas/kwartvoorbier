<template>
  <div class="min-h-[80vh] flex items-center justify-center p-4">
    <div class="w-full max-w-md space-y-8 text-center animate-fly-in">
      
      <div class="relative inline-block">
        <div class="text-8xl mb-4 animate-bounce-slow">
          🍻
        </div>
        <div class="absolute -top-2 -right-2 bg-coral-500 text-white text-xs font-black px-2 py-1 rounded-full shadow-lg rotate-12">
          NEW
        </div>
      </div>

      <div class="bg-coral-50 rounded-3xl shadow-xl p-8 border border-coral-100">
        <h1 class="text-3xl font-black text-primary-900 mb-2">
          We zijn verhuisd!
        </h1>
        <p class="text-gray-600 mb-8 leading-relaxed">
          Kwartvoorbier is verhuisd naar een sneller en mooier plekje. Je kunt hier niet meer bestellen.
        </p>

        <a 
          href="https://kwartvoorbier-fe1df.web.app" 
          class="block w-full bg-coral-500 text-red-500 py-4 px-6 rounded-2xl text-xl font-bold shadow-lg hover:bg-coral-600 transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3 group"
        >
          <span>Ga naar de nieuwe site</span>
          <span class="group-hover:translate-x-1 transition-transform">🚀</span>
        </a>

        <p class="mt-6 text-sm text-primary-600 font-medium">
          Tip: Sla de nieuwe URL direct op!
        </p>
      </div>

      <div class="text-primary-900/40 text-sm font-medium">
        kwartvoorbier.er
      </div>
      
    </div>
  </div>
</template>

<style scoped>
@keyframes flyInFromTop {
  0% { opacity: 0; transform: translateY(-40px); }
  100% { opacity: 1; transform: translateY(0); }
}

@keyframes bounceSlow {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
}

.animate-fly-in {
  opacity: 0;
  animation: flyInFromTop 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
}

.animate-bounce-slow {
  animation: bounceSlow 3s ease-in-out infinite;
}

/* Background subtiele decoratie om het koraal thema te matchen */
:host {
  background-color: #fffaf8;
}
</style>