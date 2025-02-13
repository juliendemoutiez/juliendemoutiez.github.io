<template>
  <div v-if="show"
    class="h-full w-full bg-slate-800/[.55] cursor-pointer fixed modal-overlay flex items-center justify-center"
    @click="handleClickOutside">
    <div class="modal-container relative z-50 m-6 max-w-4xl bg-white rounded-lg shadow-xl cursor-default">
      <div class="p-6">
        <div class="flex justify-between items-center mb-6">
          <p class="font-bold text-2xl text-slate-800">À propos</p>
          <button @click="$emit('close')" class="text-slate-400 hover:text-slate-600 transition-colors">
            <X />
          </button>
        </div>

        <div class="space-y-4 text-slate-800">
          <p>Bienvenue sur la <span class="font-bold">carte interactive de conformité numérique des collectivités
              territoriales</span>. Celle-ci est développée par l'ANCT dans le cadre des travaux concernant la Suite
            territoriale.</p>

          <p>
            Elle permet d'identifier les communes françaises qui ne disposent pas aujourd'hui d'un <span
              class="font-bold">socle de services numériques essentiels</span> pour assurer leur communication en
            ligne de
            manière sécurisée, selon quatre critères :
          </p>

          <ul class="list-disc ml-6 space-y-2">
            <li><span class="font-bold">Un nom de domaine institutionnel</span> et le recours à une extension (TLD)
              conforme (.fr, .bzh, .corsica, .re, .alsace, .aquitaine, .eus) qui permettent de les identifier
              formellement
              dans leurs communications en ligne</li>
            <li><span class="font-bold">La propriété de ce nom de domaine</span> avec un nom de domaine directement
              enregistré au nom de la collectivité (et non d'un prestataire ou d'un agent) qui garantit la pérennité
              des
              services et la maîtrise de l'identité numérique de la commune</li>
            <li><span class="font-bold">Un site internet officiel</span> déployé sur ce nom de domaine et disposant du
              protocole d'accès sécurisé HTTPS qui garantit la confidentialité et l'intégrité des données échangées
            </li>
            <li><span class="font-bold">Une adresse de messagerie électronique</span> officielle rattachée à ce nom de
              domaine</li>
          </ul>



          <p>
            Cette cartographie repose sur les <span class="font-bold">données officielles et ouvertes de <a
                class="text-blue-500 hover:text-blue-600 font-bold" target="_blank"
                href="https://lannuaire.service-public.fr/navigation/mairie">l'Annuaire du service public</a>
              maintenues par la Direction de l’Information Légale et Administrative (DILA)</span>. Ces données sont
            <span class="font-bold">déclaratives</span> et peuvent être mises à jour par tout acteur public. Elles sont
            par ailleurs enrichies par l’ANCT et les OPSN partenaires.
          </p>

          <p>Le code couleur reflète le niveau global de conformité :</p>
          <ul class="list-none bg-slate-100 p-4 rounded-lg space-y-2 font-mono text-sm">
            <li>🟢 <span class="font-bold">Vert</span> : La commune remplit les 4 critères susmentionnées</li>
            <li>🟡 <span class="font-bold">Jaune</span> : La commune dispose d'une messagerie conforme mais ne remplit
              pas au moins l'un des autres critères susmentionnés</li>
            <li>🟠 <span class="font-bold">Orange</span> : La commune ne dispose pas d'une messagerie conforme mais
              remplit au moins l'un des autres critères susmentionnés</li>
            <li>🔴 <span class="font-bold">Rouge</span> : La commune ne remplit aucun des critères susmentionnés</li>
          </ul>

          <p class="font-bold text-xl mt-6">Comment explorer les données ?</p>
          <ul class="list-disc ml-6 space-y-2">
            <li>Visualisez la situation globale par région en consultant les statistiques globales</li>
            <li>Cliquez sur une région pour afficher le détail par département</li>
            <li>Sélectionnez un département pour explorer les scores individuels des communes</li>
            <li>Pour chaque commune, consultez le détail des quatre critères et accédez à <a class="text-blue-500"
                target="_blank" href="https://lannuaire.service-public.fr/navigation/mairie">l’Annuaire du service
                public</a> pour demander une mise à jour.</li>
          </ul>

          <p class="mt-6">Cette cartographie s'inscrit dans le cadre du volet cyber du plan France 2030, destiné à
            élever le niveau de
            sécurité numérique des administrations publiques françaises.</p>

          <p>Aidez-nous à l'améliorer en écrivant à <a class="text-blue-500 hover:text-blue-600"
              href="mailto:suiteterritoriale@anct.gouv.fr">suiteterritoriale@anct.gouv.fr</a> !</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { X } from 'lucide-vue-next';

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  }
});

const emit = defineEmits(['close']);

// Handle click outside
const handleClickOutside = (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    emit('close');
  }
};

</script>

<style scoped>
.modal-overlay {
  z-index: 1099;
  top: 0;
}

.modal-container {
  z-index: 1100;
  top: 0;
  max-height: 90%;
  overflow: auto;
}
</style>