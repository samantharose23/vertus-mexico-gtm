export type Lang = "es" | "en";

export interface NavItem {
  label: string;
  href: string;
}

export interface StayCard {
  tag: string;
  title: string;
  body: string;
}

export interface Testimonial {
  slotId: string;
  slotHint: string;
  tag: string;
  quote: string;
  name: string;
  photoUrl?: string;
  logoUrl?: string;
  logoAlt?: string;
  logoHeight?: number;
  companyUrl?: string;
}

export interface TeamLink {
  label: string;
  href: string;
}

export interface Stat {
  value: string;
  label: string;
  color: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface Step {
  n: string;
  title: string;
  body: string;
}

export interface Content {
  htmlLang: string;
  ogLocale: string;
  metaTitle: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  langES: string;
  langEN: string;
  navLabel: string;
  menuOpenLabel: string;
  menuCloseLabel: string;
  skipLink: string;
  requiredNote: string;
  navContact: string;
  nav: NavItem[];
  heroEyebrow: string;
  heroTitle: string;
  heroLead: string;
  heroParent: string;
  ctaStart: string;
  stayEyebrow: string;
  stayTitle: string;
  stayCards: StayCard[];
  diffEyebrow: string;
  diffTitle: string;
  diffBody: string;
  diffThemLabel: string;
  diffThemHead: string;
  diffThemBody: string;
  diffUsLabel: string;
  diffUsHead: string;
  diffUsBody: string;
  mxEyebrow: string;
  mxTitle: string;
  mxBody: string;
  mapEyebrow: string;
  mapTitle: string;
  mapBody: string;
  mapCaption: string;
  mapAria: string;
  testimonials: Testimonial[];
  teamEyebrow: string;
  teamTitle: string;
  teamBody: string;
  teamLinks: TeamLink[];
  stats: Stat[];
  foundEyebrow: string;
  foundTitle: string;
  foundBody: string;
  bizHead: string;
  bizItems: string[];
  finHead: string;
  finItems: string[];
  foundCtaQ: string;
  foundCtaNote: string;
  faqEyebrow: string;
  faqTitle: string;
  faq: FaqItem[];
  appEyebrow: string;
  appTitle: string;
  appBody: string;
  appScrollHint: string;
  steps: Step[];
  appResourcesTitle: string;
  appResourcesLabel: string;
  appResourcesHref: string;
  mariaEyebrow: string;
  mariaFirst: string;
  mariaLast: string;
  mariaRole: string;
  mariaBio: string;
  mariaButton: string;
  mariaLinkedInAria: string;
  finalTitle: string;
  finalBody: string;
  whatsappLabel: string;
  formName: string;
  formCompany: string;
  formEmail: string;
  formMessage: string;
  formSend: string;
  formNote: string;
  errName: string;
  errEmail: string;
  errMessage: string;
  formSuccess: string;
  cookieAriaLabel: string;
  cookieText: string;
  cookiePrivacyLabel: string;
  cookieManage: string;
  cookieReject: string;
  cookieAccept: string;
  cookieSave: string;
  cookieNecessaryTitle: string;
  cookieNecessaryDesc: string;
  cookieAnalyticsTitle: string;
  cookieAnalyticsDesc: string;
  cookieAdsTitle: string;
  cookieAdsDesc: string;
  cookieSettingsLabel: string;
}

export const CONTENT: Record<Lang, Content> = {
  es: {
    htmlLang: "es-MX",
    ogLocale: "es_MX",
    metaTitle: "Vertus Group Mexico — Capital permanente en México",
    metaDescription:
      "Adquirimos empresas consolidadas de software vertical en México y las conservamos de forma permanente. Nunca vendemos nuestras empresas — un hogar estable, a largo plazo.",
    ogTitle: "Vertus Group Mexico — Capital permanente en México",
    ogDescription:
      "Adquirimos empresas consolidadas de software vertical en México y las conservamos de forma permanente. Nunca vendemos nuestras empresas.",
    langES: "ES",
    langEN: "EN",
    navLabel: "Navegación principal",
    menuOpenLabel: "Abrir menú",
    menuCloseLabel: "Cerrar menú",
    skipLink: "Saltar al contenido",
    requiredNote: "Los campos con * son obligatorios.",
    navContact: "Contacto",
    nav: [
      { label: "Lo que permanece", href: "#permanece" },
      { label: "Por qué el capital permanente", href: "#capital" },
      { label: "Equipo", href: "#equipo" },
      { label: "Para fundadores", href: "#fundadores" },
    ],
    heroEyebrow: "Parte de The Vertus Group",
    heroTitle: "Capital permanente\nen México",
    heroLead:
      "Adquirimos empresas consolidadas de software vertical en México y las conservamos de forma permanente. Nunca vendemos nuestras empresas. Solo un hogar estable, a largo plazo.",
    heroParent:
      "Vertus Group Mexico forma parte de The Vertus Group y Jonas Software, una empresa de Constellation Software (TSX: CSU).",
    ctaStart: "Inicia una conversación →",
    stayEyebrow: "Antes que nada",
    stayTitle: "Lo que permanece igual.",
    stayCards: [
      {
        tag: "Tu legado",
        title: "Tu gente permanece.",
        body: "Compramos empresas por las personas que las construyeron, no para reemplazarlas.",
      },
      {
        tag: "Tu identidad",
        title: "Tu marca permanece.",
        body: "Tu nombre, tu producto y tu relación con los clientes continúan tal como están.",
      },
      {
        tag: "Tu lugar",
        title: "Tu empresa se queda aquí.",
        body: "Operamos los negocios donde están. Estamos construyendo en México, a largo plazo.",
      },
      {
        tag: "Tu futuro",
        title: "Nunca revendemos.",
        body: "Las empresas de Constellation se conservan de forma permanente. Sin salida a tres años, sin segunda venta, sin reloj de fondo de inversión.",
      },
    ],
    diffEyebrow: "La diferencia",
    diffTitle: "Por qué el capital permanente es diferente.",
    diffBody:
      "La mayoría de los compradores piensa en su salida desde el día que firma. Nosotros no. Como parte de The Vertus Group —que nunca ha vendido una empresa y nunca lo hará— y de Constellation Software, con más de 1,000 empresas de software en el mundo, nuestro modelo es adquirir buenas empresas y conservarlas, ayudándolas a crecer durante décadas y no por trimestres.",
    diffThemLabel: "Otros",
    diffThemHead: "Una salida con reloj",
    diffThemBody: "Reventa, consolidación, un retorno que entregar a inversionistas.",
    diffUsLabel: "Nosotros",
    diffUsHead: "Un hogar, conservado",
    diffUsBody: "Adquirir, cuidar y hacer crecer la empresa durante décadas.",
    mxEyebrow: "Ya estamos en México",
    mxTitle: "Llegamos para quedarnos.",
    mxBody:
      "Vertus Mexico es un dueño activo y presente en el mercado de software vertical mexicano —con empresas en operación, equipos que siguen al frente y relaciones que construimos para décadas. Esto es lo que dicen quienes ya trabajan con nosotros.",
    mapEyebrow: "Nuestra base",
    mapTitle: "En el corazón de la Ciudad de México.",
    mapBody:
      "Operamos desde la Ciudad de México, cerca de los fundadores y equipos con los que trabajamos. Misma zona horaria, mismo terreno —presentes para acompañar a nuestras empresas en el largo plazo.",
    mapCaption: "Ciudad de México, México",
    mapAria: "Mapa de México con la Ciudad de México destacada",
    testimonials: [
      {
        slotId: "vx-test-nadia",
        slotHint: "Foto de Nadia Hamilton",
        tag: "Fundadora",
        quote:
          "Magnusmode se construyó sobre la convicción de que la accesibilidad es esencial, no opcional. Unirse a Vertus le permite a Magnusmode seguir impulsando esa misión mientras amplía su alcance, fortalece su tecnología y escala sin comprometer sus valores.",
        name: "Nadia Hamilton · Fundadora, Magnusmode",
        photoUrl: "/assets/avatar-nadia.png",
        logoUrl: "/assets/logo-magnusmode-big.png",
        logoAlt: "Magnusmode",
        logoHeight: 40,
        companyUrl: "https://www.magnusmode.com/",
      },
      {
        slotId: "vx-test-gilray",
        slotHint: "Logo de CAST Group of Companies",
        tag: "Fundador",
        quote:
          "Después de más de 30 años construyendo, haciendo crecer, inventando y liderando CAST, llegó el momento de pasar la antorcha. Encontramos el hogar perfecto en Vertus Group. Continuarán nuestro legado e impulsarán la empresa hacia adelante a través de la innovación, precisamente lo que hace de CAST un líder en la industria.",
        name: "Gilray Densham · Fundador, CAST Group of Companies",
        logoUrl: "/assets/logo-cast-new.png",
        logoAlt: "CAST Group of Companies",
        companyUrl: "https://www.cast-soft.com/",
      },
      {
        slotId: "vx-test-joe",
        slotHint: "Logo de Vizergy",
        tag: "Fundador y CEO",
        quote:
          "La filosofía de Vertus Group de preservar la cultura y el legado de la marca que construiste resonó conmigo. El proceso de trabajar con Vertus fue bien definido, se manejó con transparencia y el resultado fue exitoso para todas las partes involucradas.",
        name: "Joe Hyman · Fundador y CEO, Vizergy",
        logoUrl: "/assets/logo-vizergy.png",
        logoAlt: "Vizergy",
        companyUrl: "https://www.vizergy.com/",
      },
    ],
    teamEyebrow: "El equipo",
    teamTitle:
      "Presencia local en México, respaldada por todo el equipo de Vertus.",
    teamBody:
      "Vertus Group Mexico opera de forma directa y local en México —el punto de contacto está aquí, en tu mismo país y zona horaria. Detrás está el equipo completo de The Vertus Group: especialistas en M&A, operaciones, finanzas y legal, con décadas de experiencia adquiriendo y haciendo crecer empresas de software vertical en más de 36 compañías.",
    teamLinks: [
      {
        label: "Conoce al equipo de Vertus",
        href: "https://www.thevertusgroup.com/our-team.htm",
      },
    ],
    stats: [
      { value: "36+", label: "empresas en el portafolio", color: "#1A2E1A" },
      { value: "1,000+", label: "personas en el ecosistema", color: "#1A2E1A" },
      { value: "2003", label: "desde nuestra primera adquisición", color: "#1A2E1A" },
      { value: "∞", label: "horizonte de propiedad", color: "#1A2E1A" },
    ],
    foundEyebrow: "Para fundadores",
    foundTitle: "Qué buscamos.",
    foundBody:
      "Adquirimos empresas de software vertical rentables y consolidadas, y les damos un hogar permanente. Esto es lo que buscamos.",
    bizHead: "Perfil del negocio",
    bizItems: [
      "Software B2B",
      "SaaS o en sitio",
      "Enfoque en mercado vertical",
      "Software de misión crítica",
      "Soluciones propietarias",
    ],
    finHead: "Perfil financiero",
    finItems: [
      "Ingresos mayormente recurrentes",
      "En punto de equilibrio o rentable",
      "Baja pérdida de clientes",
    ],
    foundCtaQ:
      "¿Tienes curiosidad sobre lo que valdría tu empresa con un dueño permanente?",
    foundCtaNote: "Una primera conversación es confidencial y sin compromiso.",
    faqEyebrow: "Respuestas claras",
    faqTitle: "Tus dudas, respondidas con honestidad.",
    faq: [
      {
        q: "¿Van a reemplazar a mi equipo?",
        a: "Por lo general, los equipos operativos se mantienen en su lugar. Tú conoces tu negocio. Nos enfocamos en adquirir equipos de alto desempeño con conocimiento profundo de su industria.",
      },
      {
        q: "¿Van a mover mi empresa o fusionarla con otra cosa?",
        a: "No. Tu empresa sigue operando como tal, donde está, bajo su propia marca. No consolidamos los negocios en una sola máquina.",
      },
      {
        q: "¿La van a vender otra vez en unos años?",
        a: "No. Esto es el centro de lo que nos hace diferentes. The Vertus Group nunca ha vendido una empresa y nunca lo hará: conservamos los negocios de forma permanente. No hay reloj de salida.",
      },
      {
        q: "¿Qué pasa conmigo después de la venta?",
        a: "Algunos fundadores se quedan y siguen liderando con nuevo respaldo detrás; otros se retiran en una transición acordada. Lo diseñamos según lo que tú quieras.",
      },
      {
        q: "¿Está segura mi información si solo quiero explorar?",
        a: "Sí. La primera conversación es confidencial y sin compromiso. No se comparte nada y no hay presión para avanzar.",
      },
    ],
    appEyebrow: "Nuestro enfoque",
    appTitle: "Nuestro enfoque para una adquisición sin sobresaltos.",
    appBody:
      "Sabemos que construir tu empresa tomó años de dedicación, y queremos ayudar a asegurar su futuro y el tuyo. Este es el camino que recorremos juntos, con transparencia en cada paso.",
    appScrollHint: "Sigue deslizando para ver cada paso",
    steps: [
      {
        n: "1",
        title: "Conversemos",
        body: "Empezamos con una conversación. Nuestro equipo escucha, entiende tu visión y atiende tus dudas, para que estés cómodo en cada paso.",
      },
      {
        n: "2",
        title: "Habla con un operador",
        body: "Conoce a profesionales que ya recorrieron este camino. Te darán claridad sobre el proceso y cómo tu empresa puede pasar a su siguiente capítulo sin fricción.",
      },
      {
        n: "3",
        title: "Firma un acuerdo de confidencialidad",
        body: "Tu información está segura con nosotros. El acuerdo de confidencialidad protege tus datos sensibles para que explores la venta en un entorno seguro.",
      },
      {
        n: "4",
        title: "Hablemos del encaje",
        body: "Creemos en alianzas alineadas con tus metas. Veamos cómo tu empresa encaja en nuestra visión de largo plazo y qué soluciones se ajustan a tu caso.",
      },
      {
        n: "5",
        title: "Oferta",
        body: "Recibe una oferta justa y transparente, basada en el valor de tu empresa de software, para que tomes una decisión informada.",
      },
      {
        n: "6",
        title: "Debida diligencia",
        body: "Revisamos los detalles a fondo para asegurar una transición tranquila. Nuestro enfoque minucioso está diseñado para evitar sorpresas.",
      },
      {
        n: "7",
        title: "Cierre",
        body: "Con la documentación lista, cerramos. El proceso está pensado para ser eficiente y claro, respetando tus tiempos.",
      },
      {
        n: "8",
        title: "Integración",
        body: "Bienvenido a la familia Vertus. Tu empresa se integra al portafolio y aprovecha nuestros recursos, experiencia y compromiso permanente con su crecimiento.",
      },
    ],
    appResourcesTitle: "¿Quieres saber más sobre Vertus?",
    appResourcesLabel: "Recursos y novedades de Vertus",
    appResourcesHref: "https://www.thevertusgroup.com/blog/",
    mariaEyebrow: "Tu contacto en México",
    mariaFirst: "Maria",
    mariaLast: "Demopoulos",
    mariaRole: "Líder de Grupo · América Latina",
    mariaBio:
      "Maria Demopoulos lidera la expansión de Vertus Group en América Latina. Expresidenta de una empresa de software adquirida por el grupo, aporta una disciplina centrada en el operador a uno de los ecosistemas de software más dinámicos del mundo. Si estás considerando el futuro de tu empresa, ella es tu punto de contacto directo —en tu mismo país y zona horaria.",
    mariaButton: "Escríbele a Maria",
    mariaLinkedInAria: "Perfil de LinkedIn de Maria Demopoulos",
    finalTitle: "¿Pensando en el futuro de tu empresa?",
    finalBody:
      "Hablemos —de forma confidencial y sin compromiso. Hablarás directamente con uno de nuestros líderes operativos o de M&A.",
    whatsappLabel: "O escríbenos por WhatsApp",
    formName: "Nombre",
    formCompany: "Empresa",
    formEmail: "Correo",
    formMessage: "Mensaje",
    formSend: "Enviar →",
    formNote: "Confidencial. Solo lo usamos para responderte.",
    errName: "Escribe tu nombre.",
    errEmail: "Escribe un correo válido.",
    errMessage: "Cuéntanos brevemente.",
    formSuccess: "Gracias. Te responderemos pronto.",
    cookieAriaLabel: "Consentimiento de cookies",
    cookieText:
      "Usamos cookies para analítica y publicidad. Solo las activamos con tu consentimiento. Puedes aceptar todas, rechazar todas o elegir por categoría.",
    cookiePrivacyLabel: "Consulta nuestro Aviso de Privacidad",
    cookieManage: "Administrar preferencias",
    cookieReject: "Rechazar todas",
    cookieAccept: "Aceptar todas",
    cookieSave: "Guardar preferencias",
    cookieNecessaryTitle: "Estrictamente necesarias",
    cookieNecessaryDesc:
      "Necesarias para que el sitio funcione. Siempre activas.",
    cookieAnalyticsTitle: "Analítica",
    cookieAnalyticsDesc:
      "Nos ayuda a entender cómo se usa el sitio (Google Analytics).",
    cookieAdsTitle: "Publicidad",
    cookieAdsDesc: "Se usa para medir y personalizar el marketing.",
    cookieSettingsLabel: "Configuración de cookies",
  },
  en: {
    htmlLang: "en",
    ogLocale: "en_US",
    metaTitle: "Vertus Group Mexico — Permanent capital in Mexico",
    metaDescription:
      "We acquire established vertical software companies in Mexico and hold them permanently. We never sell our companies — a stable, long-term home.",
    ogTitle: "Vertus Group Mexico — Permanent capital in Mexico",
    ogDescription:
      "We acquire established vertical software companies in Mexico and hold them permanently. We never sell our companies.",
    langES: "ES",
    langEN: "EN",
    navLabel: "Main navigation",
    menuOpenLabel: "Open menu",
    menuCloseLabel: "Close menu",
    skipLink: "Skip to content",
    requiredNote: "Fields marked with * are required.",
    navContact: "Contact",
    nav: [
      { label: "What stays the same", href: "#permanece" },
      { label: "Why permanent capital", href: "#capital" },
      { label: "Team", href: "#equipo" },
      { label: "For founders", href: "#fundadores" },
    ],
    heroEyebrow: "Part of The Vertus Group",
    heroTitle: "Permanent Capital\nin Mexico",
    heroLead:
      "We acquire established vertical-market software businesses in Mexico and hold them for good. We never sell our businesses. Just a stable owner for the long term.",
    heroParent:
      "Vertus Mexico is part of The Vertus Group and Jonas Software, a Constellation Software Company (TSX: CSU).",
    ctaStart: "Start a conversation →",
    stayEyebrow: "Before anything else",
    stayTitle: "What stays the same.",
    stayCards: [
      {
        tag: "Your legacy",
        title: "Your people stay.",
        body: "We buy companies because of the people who built them, not to replace them.",
      },
      {
        tag: "Your identity",
        title: "Your brand stays.",
        body: "Your name, your product, your customer relationships continue as they are.",
      },
      {
        tag: "Your place",
        title: "Your company stays here.",
        body: "We operate businesses where they are. We're building in Mexico, for the long term.",
      },
      {
        tag: "Your future",
        title: "We never resell.",
        body: "Constellation companies are held permanently. No three-year exit, no second sale, no private-equity clock.",
      },
    ],
    diffEyebrow: "The difference",
    diffTitle: "Why permanent capital is different.",
    diffBody:
      "Most buyers have an exit in mind from the day they sign. We don't. As part of The Vertus Group — which has never sold a company and never will — and Constellation Software, with more than 1,000 software businesses worldwide, our model is to acquire good companies and keep them, helping them grow over decades rather than quarters.",
    diffThemLabel: "Most buyers",
    diffThemHead: "An exit on the clock",
    diffThemBody: "Resale, roll-up, a return to deliver to investors.",
    diffUsLabel: "Us",
    diffUsHead: "A home, kept",
    diffUsBody: "Acquire, steward, and grow the company over decades.",
    mxEyebrow: "Established in Mexico",
    mxTitle: "We're here to stay.",
    mxBody:
      "Vertus Mexico is an active, present owner in Mexico's vertical-market software landscape — with operating companies, teams still at the helm, and relationships built to last decades. Here's what the people who already work with us say.",
    mapEyebrow: "Our base",
    mapTitle: "At the heart of Mexico City.",
    mapBody:
      "We operate from Mexico City, close to the founders and teams we work with. Same time zone, same ground — present to support our companies for the long term.",
    mapCaption: "Mexico City, Mexico",
    mapAria: "Map of Mexico with Mexico City highlighted",
    testimonials: [
      {
        slotId: "vx-test-nadia",
        slotHint: "Photo of Nadia Hamilton",
        tag: "Founder",
        quote:
          "Magnusmode was built on the belief that accessibility is essential, not optional. Joining Vertus allows Magnusmode to continue advancing that mission while expanding reach, strengthening technology, and scaling without compromising its values.",
        name: "Nadia Hamilton · Founder, Magnusmode",
        photoUrl: "/assets/avatar-nadia.png",
        logoUrl: "/assets/logo-magnusmode-big.png",
        logoAlt: "Magnusmode",
        logoHeight: 40,
        companyUrl: "https://www.magnusmode.com/",
      },
      {
        slotId: "vx-test-gilray",
        slotHint: "CAST Group of Companies logo",
        tag: "Founder",
        quote:
          "After more than 30 years of building, growing, inventing, and leading CAST, it was time to pass on the torch. We found the perfect home in Vertus Group. They will continue our legacy and drive the company forward through innovation, the very thing that makes CAST an industry leader.",
        name: "Gilray Densham · Founder, CAST Group of Companies",
        logoUrl: "/assets/logo-cast-new.png",
        logoAlt: "CAST Group of Companies",
        companyUrl: "https://www.cast-soft.com/",
      },
      {
        slotId: "vx-test-joe",
        slotHint: "Vizergy logo",
        tag: "Founder & CEO",
        quote:
          "Vertus Group's philosophy of preserving the culture and legacy of the brand you built resonated with me. The process of working with Vertus was well-defined, managed with transparency, and the outcome was successful for all stakeholders.",
        name: "Joe Hyman · Founder & CEO, Vizergy",
        logoUrl: "/assets/logo-vizergy.png",
        logoAlt: "Vizergy",
        companyUrl: "https://www.vizergy.com/",
      },
    ],
    teamEyebrow: "The team",
    teamTitle: "Local presence in Mexico, backed by the full Vertus team.",
    teamBody:
      "Vertus Group Mexico operates directly and locally in Mexico — your point of contact is here, in your country and time zone. Behind it stands the full team at The Vertus Group: M&A, operations, finance, and legal specialists with decades of experience acquiring and growing vertical-market software companies across 36+ businesses.",
    teamLinks: [
      {
        label: "Meet the Vertus team",
        href: "https://www.thevertusgroup.com/our-team.htm",
      },
    ],
    stats: [
      { value: "36+", label: "portfolio companies", color: "#1A2E1A" },
      { value: "1,000+", label: "people across the ecosystem", color: "#1A2E1A" },
      { value: "2003", label: "since our first acquisition", color: "#1A2E1A" },
      { value: "∞", label: "ownership horizon", color: "#1A2E1A" },
    ],
    foundEyebrow: "For founders",
    foundTitle: "What we look for.",
    foundBody:
      "We acquire profitable, established vertical-market software companies and give them a permanent home. Here's what we look for.",
    bizHead: "Business profile",
    bizItems: [
      "B2B software",
      "SaaS or on-premise",
      "Vertical-market focus",
      "Mission-critical software",
      "Proprietary solutions",
    ],
    finHead: "Financial profile",
    finItems: [
      "Majority recurring revenue",
      "Breakeven or profitable",
      "Low customer attrition",
    ],
    foundCtaQ: "Curious what your company could be worth with a permanent owner?",
    foundCtaNote:
      "A first conversation is confidential and carries no obligation.",
    faqEyebrow: "Straight answers",
    faqTitle: "Your questions, answered honestly.",
    faq: [
      {
        q: "Will you replace my team?",
        a: "Operating teams are typically kept in place. You know your business. We focus on acquiring high-performing teams with deep industry knowledge.",
      },
      {
        q: "Will you move my company or merge it into something else?",
        a: "No. Your company keeps operating as itself, where it is, under its own brand. We don't consolidate businesses into one machine.",
      },
      {
        q: "Will you sell it again in a few years?",
        a: "No. This is the core of how we're different. The Vertus Group has never sold a company and never will — we hold businesses permanently. There is no exit clock.",
      },
      {
        q: "What happens to me after the sale?",
        a: "Some founders stay and keep leading with new support behind them; others step back over an agreed transition. We'll design it around what you want.",
      },
      {
        q: "Is my information safe if I just want to explore?",
        a: "Yes. The first conversation is confidential and carries no obligation. Nothing is shared, and there's no pressure to proceed.",
      },
    ],
    appEyebrow: "Our approach",
    appTitle: "Our approach to a smooth acquisition.",
    appBody:
      "We know your business took years of dedication to build, and we want to help secure its future and yours. Here's the path we walk together, transparent at every step.",
    appScrollHint: "Keep scrolling to reveal each step",
    steps: [
      {
        n: "1",
        title: "Meet with us",
        body: "We start with a conversation. Our team listens, understands your vision, and addresses your concerns so you're comfortable at every step.",
      },
      {
        n: "2",
        title: "Speak with an operator",
        body: "Meet professionals who've walked this path before. They'll bring clarity on the process and how your company can move to its next chapter seamlessly.",
      },
      {
        n: "3",
        title: "Sign an NDA",
        body: "Your information is safe with us. An NDA keeps your sensitive data confidential so you can explore a sale in a secure environment.",
      },
      {
        n: "4",
        title: "Discuss fit",
        body: "We believe in partnerships aligned with your goals. Let's explore how your business fits our long-term vision and what solutions suit your situation.",
      },
      {
        n: "5",
        title: "Offer",
        body: "Receive a fair, transparent offer based on your software business's value, so you can make an informed decision.",
      },
      {
        n: "6",
        title: "Due diligence",
        body: "We examine the details thoroughly to ensure a smooth transition. Our careful approach is designed to keep surprises at bay.",
      },
      {
        n: "7",
        title: "Close",
        body: "With the paperwork finalized, we close. The process is built to be efficient and clear, and to respect your timeline.",
      },
      {
        n: "8",
        title: "Integrate",
        body: "Welcome to the Vertus family. Your company joins the portfolio and benefits from our resources, expertise, and lasting commitment to its growth.",
      },
    ],
    appResourcesTitle: "Want to learn more about Vertus?",
    appResourcesLabel: "Vertus resources & news",
    appResourcesHref: "https://www.thevertusgroup.com/blog/",
    mariaEyebrow: "Your contact in Mexico",
    mariaFirst: "Maria",
    mariaLast: "Demopoulos",
    mariaRole: "Group Leader · Latin America",
    mariaBio:
      "Maria Demopoulos leads Vertus Group's expansion across Latin America. A former president of a software company acquired by the group, she brings operator-first discipline to one of the world's most dynamic software ecosystems. If you're thinking about the future of your company, she's your direct point of contact — in your own country and time zone.",
    mariaButton: "Write to Maria",
    mariaLinkedInAria: "Maria Demopoulos's LinkedIn profile",
    finalTitle: "Thinking about the future of your company?",
    finalBody:
      "Let's talk — confidentially, with no obligation. You'll speak directly with one of our operational or M&A leaders.",
    whatsappLabel: "Or message us on WhatsApp",
    formName: "Name",
    formCompany: "Company",
    formEmail: "Email",
    formMessage: "Message",
    formSend: "Send →",
    formNote: "Confidential. We only use this to reply to you.",
    errName: "Please enter your name.",
    errEmail: "Please enter a valid email.",
    errMessage: "Add a short message.",
    formSuccess: "Thank you. We'll be in touch soon.",
    cookieAriaLabel: "Cookie consent",
    cookieText:
      "We use cookies for analytics and advertising. We only set them with your consent. You can accept all, reject all, or choose by category.",
    cookiePrivacyLabel: "See our Privacy Policy",
    cookieManage: "Manage preferences",
    cookieReject: "Reject all",
    cookieAccept: "Accept all",
    cookieSave: "Save preferences",
    cookieNecessaryTitle: "Strictly necessary",
    cookieNecessaryDesc: "Required for the site to function. Always on.",
    cookieAnalyticsTitle: "Analytics",
    cookieAnalyticsDesc:
      "Helps us understand how the site is used (Google Analytics).",
    cookieAdsTitle: "Advertising",
    cookieAdsDesc: "Used to measure and personalize marketing.",
    cookieSettingsLabel: "Cookie Settings",
  },
};

export const WHATSAPP_URL = "https://wa.me/52XXXXXXXXXX";

// PLACEHOLDERS — replace with Maria's confirmed email and LinkedIn URL.
export const MARIA_EMAIL_URL = "mailto:maria.demopoulos@thevertusgroup.com";
export const MARIA_LINKEDIN_URL =
  "https://www.linkedin.com/company/the-vertus-group/";
