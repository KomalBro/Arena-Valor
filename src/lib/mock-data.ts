
import { type AppSettings } from "@/types";

// NOTE: This file is now only used for some app-wide settings.
// Most data is now fetched from Firebase Firestore.

export const appSettings: AppSettings = {
    appName: "Arena Valor",
    logoUrl: "https://placehold.co/64x64.png",
    upiAddress: "arena-valor@upi",
    supportContact: "+911234567890",
    minWithdrawal: 100,
    referralBonus: 50,
    privacyPolicy: "This is the privacy policy. It needs to be filled with actual content. Your privacy is important to us. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application. We may change this Privacy Policy from time to time. If we make changes, we will notify you by revising the date at the top of the policy and, in some cases, we may provide you with additional notice.",
    refundPolicy: "This is the refund policy. It needs to be filled with actual content. All entry fees are non-refundable except in the case of tournament cancellation by the organizers. If a tournament is cancelled, all participants will receive a full refund of their entry fee to their original payment source (deposit or winning wallet) within 24-48 hours.",
    termsOfUse: "These are the terms of use. They need to be filled with actual content. By accessing or using the Arena Valor application, you agree to be bound by these terms. If you disagree with any part of the terms, you may not access the service. You must be 18 years or older to use this application. You are responsible for any activity that occurs under your screen name.",
    fairPlayPolicy: "This is the fair play policy. It needs to be filled with actual content. Arena Valor is committed to ensuring a fair and competitive environment for all players. Any use of hacks, cheats, or third-party software to gain an unfair advantage is strictly prohibited. Players found to be in violation of the fair play policy will be disqualified from tournaments and may face a permanent ban from the platform.",
};
