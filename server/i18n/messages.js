const messages = {
  en: {
    notAuthorized: 'Not authorized',
    serverError: 'Server error',
    tooMany: 'Too many requests, please try again later.',
    userExists: 'User already exists',
    invalidCredentials: 'Invalid credentials',
    loggedOut: 'Logged out',
    resetSentGeneric: 'If that email exists, a reset link was sent',
    resetInvalid: 'Reset link is invalid or has expired',
    passwordReset: 'Password has been reset',
    userNotFound: 'User not found',
    postNotFound: 'Post not found',
    postRemoved: 'Post removed',
    commentNotFound: 'Comment not found',
    commentRemoved: 'Comment removed',
    markedRead: 'Marked as read',
    viewed: 'Viewed',
    followed: 'Followed',
    unfollowed: 'Unfollowed',
    noFile: 'No file provided',
    fileTooLarge: 'File is too large (max 10MB)',
    onlyImages: 'Only image files are allowed',
    uploadNotConfigured: 'Image upload is not configured on the server',
    uploadFailed: 'Image upload failed, please try again',
    emailSubject: 'Reset your Rivvo password',
    emailHi: 'Hi {name},',
    emailBody: 'Click the link below to reset your Rivvo password. This link expires in 1 hour.',
    emailIgnore: "If you didn't request this, you can ignore this email.",
  },
  ar: {
    notAuthorized: 'غير مصرّح لك',
    serverError: 'خطأ في الخادم',
    tooMany: 'طلبات كثيرة جدًا، يرجى المحاولة لاحقًا.',
    userExists: 'المستخدم موجود بالفعل',
    invalidCredentials: 'بيانات الدخول غير صحيحة',
    loggedOut: 'تم تسجيل الخروج',
    resetSentGeneric: 'إذا كان البريد الإلكتروني مسجلًا، فقد أُرسل رابط إعادة التعيين',
    resetInvalid: 'رابط إعادة التعيين غير صالح أو منتهي الصلاحية',
    passwordReset: 'تمت إعادة تعيين كلمة المرور',
    userNotFound: 'المستخدم غير موجود',
    postNotFound: 'المنشور غير موجود',
    postRemoved: 'تم حذف المنشور',
    commentNotFound: 'التعليق غير موجود',
    commentRemoved: 'تم حذف التعليق',
    markedRead: 'تم التعليم كمقروء',
    viewed: 'تمت المشاهدة',
    followed: 'تمت المتابعة',
    unfollowed: 'تم إلغاء المتابعة',
    noFile: 'لم يتم تحديد ملف',
    fileTooLarge: 'الملف كبير جدًا (الحد الأقصى 10 ميغابايت)',
    onlyImages: 'يُسمح بملفات الصور فقط',
    uploadNotConfigured: 'رفع الصور غير مُفعَّل على الخادم',
    uploadFailed: 'فشل رفع الصورة، يرجى المحاولة مرة أخرى',
    emailSubject: 'إعادة تعيين كلمة مرور Rivvo',
    emailHi: 'مرحبًا {name}،',
    emailBody: 'اضغط على الرابط أدناه لإعادة تعيين كلمة مرور Rivvo. تنتهي صلاحية الرابط خلال ساعة واحدة.',
    emailIgnore: 'إذا لم تطلب ذلك، يمكنك تجاهل هذا البريد.',
  },
};

const SUPPORTED = ['en', 'ar'];

function pickLang(header = '') {
  const first = header.split(',')[0]?.trim().slice(0, 2).toLowerCase();
  return SUPPORTED.includes(first) ? first : 'en';
}

function translate(lang, key, vars = {}) {
  let str = messages[lang]?.[key] ?? messages.en[key] ?? key;
  Object.entries(vars).forEach(([k, v]) => { str = str.replace(`{${k}}`, v); });
  return str;
}

module.exports = { pickLang, translate };
