export type Step = { title: string; body: string };
export type Faq = { q: string; a: string };

export type Variant = {
  id: string;
  name: string;
  imapHost: string;
  imapPort: number;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
};

export type Provider = {
  id: string;
  name: string;
  /** Short label shown on the logo tile. */
  mark: string;
  tint: string;
  tagline: string;
  status: "ready" | "unsupported";
  imapHost: string;
  imapPort: number;
  smtpHost: string;
  smtpPort: number;
  /** true = implicit TLS (465); false = STARTTLS (587) */
  smtpSecure: boolean;
  usernameHint: string;
  passwordLabel: string;
  needs: string[];
  steps: Step[];
  link?: { label: string; url: string };
  faq: Faq[];
  /** Only for generic webmail: well-known hosting presets. */
  variants?: Variant[];
  unsupportedReason?: string;
};

const common = (extra: Faq[] = []): Faq[] => [
  ...extra,
  {
    q: "Is it safe to give an app password?",
    a: "Yes. An app password only works for mail apps, can be revoked at any time without changing your real password, and is stored here encrypted. Your normal password is never needed.",
  },
  {
    q: "It says my password is wrong, but I copied it correctly.",
    a: "Make sure you pasted the app password, not your normal one. Remove spaces or dashes if your provider shows them, and use your full email address as the username.",
  },
];

export const PROVIDERS: Provider[] = [
  {
    id: "icloud",
    name: "iCloud Mail",
    mark: "iCloud",
    tint: "#E8F1FF",
    tagline: "@icloud.com, @me.com, @mac.com and custom iCloud+ domains",
    status: "ready",
    imapHost: "imap.mail.me.com", imapPort: 993, smtpHost: "smtp.mail.me.com", smtpPort: 587, smtpSecure: false,
    usernameHint: "Your full iCloud address, e.g. name@icloud.com",
    passwordLabel: "App-specific password",
    needs: ["Two-factor authentication turned on for your Apple Account", "A web browser"],
    steps: [
      { title: "Open your Apple Account", body: "Go to account.apple.com and sign in with your Apple Account." },
      { title: "Go to Sign-In and Security", body: "Choose Sign-In and Security, then App-Specific Passwords." },
      { title: "Create a new one", body: "Click the + button, name it something like “InboxBridge”, and confirm with your Apple password if asked." },
      { title: "Copy the password", body: "Apple shows a code like abcd-efgh-ijkl-mnop. Copy it now. Apple will not show it again." },
      { title: "Paste it here", body: "Enter your iCloud address and paste the code as the password. Leave the server settings as they are." },
    ],
    link: { label: "Open Apple Account", url: "https://account.apple.com" },
    faq: common([
      { q: "I don't see App-Specific Passwords.", a: "Turn on two-factor authentication for your Apple Account first. App-specific passwords only appear after that." },
      { q: "Do I use my @icloud.com address or my Apple Account email?", a: "Use the iCloud mail address you want the AI to read. If that is different from your Apple Account email, still use the mail address as the username." },
    ]),
  },
  {
    id: "gmail",
    name: "Gmail",
    mark: "Gmail",
    tint: "#FDECEA",
    tagline: "Personal @gmail.com accounts",
    status: "ready",
    imapHost: "imap.gmail.com", imapPort: 993, smtpHost: "smtp.gmail.com", smtpPort: 465, smtpSecure: true,
    usernameHint: "Your full Gmail address",
    passwordLabel: "Google app password (16 letters)",
    needs: ["2-Step Verification turned on for your Google Account"],
    steps: [
      { title: "Turn on 2-Step Verification", body: "In your Google Account go to Security → 2-Step Verification and switch it on if it isn't already." },
      { title: "Open App passwords", body: "Visit myaccount.google.com/apppasswords. (If the page isn't found, 2-Step Verification is not on yet.)" },
      { title: "Create an app password", body: "Type a name such as “InboxBridge” and click Create." },
      { title: "Copy the 16 letters", body: "Google shows a yellow box with a 16-letter code. Copy it. You can type it with or without spaces." },
      { title: "Paste it here", body: "Enter your Gmail address and paste the code as the password." },
    ],
    link: { label: "Create a Google app password", url: "https://myaccount.google.com/apppasswords" },
    faq: common([
      { q: "Why not “Sign in with Google”?", a: "Google asks every app that reads full mailboxes to pass a paid security review. App passwords give you the same result without that, and you stay in control." },
    ]),
  },
  {
    id: "google-workspace",
    name: "Google Workspace",
    mark: "Workspace",
    tint: "#E7F6EC",
    tagline: "Company email on Google (you@yourcompany.com)",
    status: "ready",
    imapHost: "imap.gmail.com", imapPort: 993, smtpHost: "smtp.gmail.com", smtpPort: 465, smtpSecure: true,
    usernameHint: "Your full work address, e.g. you@yourcompany.com",
    passwordLabel: "Google app password (16 letters)",
    needs: ["2-Step Verification on your account", "Your Workspace admin allows app passwords (ask them if the page is missing)"],
    steps: [
      { title: "Check 2-Step Verification", body: "Go to myaccount.google.com → Security and make sure 2-Step Verification is on." },
      { title: "Open App passwords", body: "Visit myaccount.google.com/apppasswords while signed in with your work account." },
      { title: "Missing page? Ask your admin", body: "Admins control this in Admin console → Security → Authentication → 2-Step Verification, and must allow users to turn on 2SV. App passwords are blocked if the organization uses only security keys." },
      { title: "Create and copy", body: "Name it “InboxBridge”, click Create, and copy the 16-letter code." },
      { title: "Paste it here", body: "Enter your work address and paste the code as the password." },
    ],
    link: { label: "Create a Google app password", url: "https://myaccount.google.com/apppasswords" },
    faq: common(),
  },
  {
    id: "yahoo",
    name: "Yahoo Mail",
    mark: "Yahoo!",
    tint: "#F1E9FF",
    tagline: "@yahoo.com, @ymail.com and regional Yahoo addresses",
    status: "ready",
    imapHost: "imap.mail.yahoo.com", imapPort: 993, smtpHost: "smtp.mail.yahoo.com", smtpPort: 465, smtpSecure: true,
    usernameHint: "Your full Yahoo address",
    passwordLabel: "Yahoo app password",
    needs: ["A Yahoo account with a phone number or recovery method"],
    steps: [
      { title: "Open Account security", body: "Go to login.yahoo.com/account/security and sign in." },
      { title: "Generate an app password", body: "Click “Generate app password” (or “Manage app passwords”)." },
      { title: "Name it", body: "Choose “Other app” and type “InboxBridge”, then click Generate." },
      { title: "Copy the code", body: "Copy the 16-character password Yahoo shows." },
      { title: "Paste it here", body: "Enter your Yahoo address and paste the code as the password." },
    ],
    link: { label: "Open Yahoo account security", url: "https://login.yahoo.com/account/security" },
    faq: common(),
  },
  {
    id: "fastmail",
    name: "Fastmail",
    mark: "Fastmail",
    tint: "#E6F3FF",
    tagline: "Fastmail and custom domains hosted on Fastmail",
    status: "ready",
    imapHost: "imap.fastmail.com", imapPort: 993, smtpHost: "smtp.fastmail.com", smtpPort: 465, smtpSecure: true,
    usernameHint: "Your full Fastmail address",
    passwordLabel: "Fastmail app password",
    needs: ["A Fastmail account"],
    steps: [
      { title: "Open Settings", body: "In Fastmail click your profile picture → Settings → Privacy & Security." },
      { title: "Go to Integrations", body: "Open the Integrations tab and click New app password." },
      { title: "Pick the access level", body: "Name it “InboxBridge” and choose “Mail (IMAP/POP/SMTP)”. Click Generate." },
      { title: "Copy the password", body: "Copy the password shown." },
      { title: "Paste it here", body: "Enter your Fastmail address and paste the password." },
    ],
    link: { label: "Open Fastmail settings", url: "https://app.fastmail.com/settings/security/integrations" },
    faq: common(),
  },
  {
    id: "zoho",
    name: "Zoho Mail",
    mark: "Zoho",
    tint: "#FFF1E3",
    tagline: "Zoho Mail personal and business accounts",
    status: "ready",
    imapHost: "imap.zoho.com", imapPort: 993, smtpHost: "smtp.zoho.com", smtpPort: 465, smtpSecure: true,
    usernameHint: "Your full Zoho address",
    passwordLabel: "Zoho app-specific password",
    needs: ["IMAP access turned on in Zoho Mail", "Two-factor authentication on (needed for app passwords)"],
    steps: [
      { title: "Turn on IMAP", body: "In Zoho Mail go to Settings → Mail Accounts → IMAP Access and enable IMAP." },
      { title: "Open Security", body: "Go to accounts.zoho.com → Security → App Passwords." },
      { title: "Generate a password", body: "Name it “InboxBridge” and click Generate. Copy the password." },
      { title: "Check your region", body: "If your account lives on zoho.eu, zoho.in, zoho.com.au or zoho.jp, change the server names below to imap.zoho.eu / smtp.zoho.eu (and so on)." },
      { title: "Paste it here", body: "Enter your Zoho address and the app password." },
    ],
    link: { label: "Open Zoho security", url: "https://accounts.zoho.com/home#security/app_password" },
    faq: common([{ q: "My Zoho account is on .eu / .in. What do I enter?", a: "Replace .com in both server names with your region, e.g. imap.zoho.eu and smtp.zoho.eu." }]),
  },
  {
    id: "yandex",
    name: "Yandex Mail",
    mark: "Yandex",
    tint: "#FFEAEA",
    tagline: "@yandex.com and @yandex.ru",
    status: "ready",
    imapHost: "imap.yandex.com", imapPort: 993, smtpHost: "smtp.yandex.com", smtpPort: 465, smtpSecure: true,
    usernameHint: "Your full Yandex address",
    passwordLabel: "Yandex app password",
    needs: ["IMAP turned on in Yandex Mail settings"],
    steps: [
      { title: "Turn on IMAP", body: "In Yandex Mail open Settings → Email clients and tick “From the imap.yandex.com server via IMAP”." },
      { title: "Create an app password", body: "Go to id.yandex.com/security/app-passwords and click Create new password." },
      { title: "Choose Mail", body: "Pick the “Mail” type, name it “InboxBridge”, and create it." },
      { title: "Copy the password", body: "Copy the generated password." },
      { title: "Paste it here", body: "Enter your Yandex address and paste the password." },
    ],
    link: { label: "Yandex app passwords", url: "https://id.yandex.com/security/app-passwords" },
    faq: common(),
  },
  {
    id: "aol",
    name: "AOL Mail",
    mark: "AOL",
    tint: "#EAF0FF",
    tagline: "@aol.com",
    status: "ready",
    imapHost: "imap.aol.com", imapPort: 993, smtpHost: "smtp.aol.com", smtpPort: 465, smtpSecure: true,
    usernameHint: "Your full AOL address",
    passwordLabel: "AOL app password",
    needs: ["An AOL account"],
    steps: [
      { title: "Open Account security", body: "Go to login.aol.com/account/security and sign in." },
      { title: "Generate an app password", body: "Click “Generate app password”, choose “Other app”, name it “InboxBridge”." },
      { title: "Copy it", body: "Copy the password AOL shows." },
      { title: "Paste it here", body: "Enter your AOL address and paste the password." },
    ],
    link: { label: "Open AOL account security", url: "https://login.aol.com/account/security" },
    faq: common(),
  },
  {
    id: "webmail",
    name: "Business & Webmail",
    mark: "Webmail",
    tint: "#EFEAFE",
    tagline: "cPanel, Roundcube, Hostinger, Namecheap, GoDaddy, IONOS and any host with IMAP",
    status: "ready",
    imapHost: "", imapPort: 993, smtpHost: "", smtpPort: 465, smtpSecure: true,
    usernameHint: "Your full email address (almost always)",
    passwordLabel: "Your mailbox password",
    needs: ["The mailbox password (or an app password if your host offers them)", "IMAP/SMTP server names from your hosting provider"],
    steps: [
      { title: "Find your mail server names", body: "Log in to your hosting panel (cPanel, Hostinger hPanel, Namecheap, GoDaddy…). Open Email Accounts and choose Connect Devices / Mail Client Manual Settings. It lists the incoming (IMAP) and outgoing (SMTP) servers." },
      { title: "Pick your host below", body: "If you use Hostinger, Namecheap Private Email, GoDaddy or IONOS, choose it from the list and the servers fill in automatically." },
      { title: "Otherwise, type them in", body: "Typical values: IMAP mail.yourdomain.com port 993, SMTP mail.yourdomain.com port 465 (SSL/TLS)." },
      { title: "Use the full address as username", body: "Enter your full email address and the mailbox password." },
      { title: "Test & connect", body: "We log in to both servers before saving. If it fails, the error says which one." },
    ],
    faq: common([
      { q: "What is “webmail”?", a: "Roundcube, cPanel, Horde and similar are just a website in front of your normal mailbox. Under the hood they use IMAP and SMTP, which is what we connect to." },
      { q: "Which port should I use?", a: "IMAP: 993 (secure). SMTP: 465 (SSL/TLS) or 587 (STARTTLS). Your host's Connect Devices page tells you which." },
    ]),
    variants: [
      { id: "custom", name: "Other host (type the servers)", imapHost: "", imapPort: 993, smtpHost: "", smtpPort: 465, smtpSecure: true },
      { id: "hostinger", name: "Hostinger", imapHost: "imap.hostinger.com", imapPort: 993, smtpHost: "smtp.hostinger.com", smtpPort: 465, smtpSecure: true },
      { id: "namecheap", name: "Namecheap Private Email", imapHost: "mail.privateemail.com", imapPort: 993, smtpHost: "mail.privateemail.com", smtpPort: 465, smtpSecure: true },
      { id: "godaddy", name: "GoDaddy Workspace Email", imapHost: "imap.secureserver.net", imapPort: 993, smtpHost: "smtpout.secureserver.net", smtpPort: 465, smtpSecure: true },
      { id: "ionos", name: "IONOS", imapHost: "imap.ionos.com", imapPort: 993, smtpHost: "smtp.ionos.com", smtpPort: 587, smtpSecure: false },
    ],
  },
  {
    id: "outlook",
    name: "Outlook / Microsoft 365",
    mark: "Outlook",
    tint: "#E3F2FD",
    tagline: "Outlook.com, Hotmail, Live and Microsoft 365 work email",
    status: "unsupported",
    imapHost: "outlook.office365.com", imapPort: 993, smtpHost: "smtp.office365.com", smtpPort: 587, smtpSecure: false,
    usernameHint: "",
    passwordLabel: "",
    needs: [],
    steps: [],
    unsupportedReason:
      "Microsoft turned off password sign-in for IMAP and SMTP, so app passwords no longer work for Outlook.com, Hotmail or Microsoft 365. Connecting needs a Microsoft sign-in (OAuth) integration, which this version doesn't include yet. Tip: if your mail also arrives in another mailbox (or you forward it), connect that one.",
    faq: [],
  },
  {
    id: "proton",
    name: "Proton Mail",
    mark: "Proton",
    tint: "#EFEAFE",
    tagline: "Proton Mail (encrypted)",
    status: "unsupported",
    imapHost: "", imapPort: 993, smtpHost: "", smtpPort: 465, smtpSecure: true,
    usernameHint: "",
    passwordLabel: "",
    needs: [],
    steps: [],
    unsupportedReason:
      "Proton encrypts mail on your device, so it only offers IMAP through “Proton Mail Bridge”, a desktop app that must stay running on your computer. A hosted server can't use it.",
    faq: [],
  },
];

export const READY_PROVIDERS = PROVIDERS.filter((p) => p.status === "ready");

export function getProvider(id: string): Provider | undefined {
  return PROVIDERS.find((p) => p.id === id);
}
