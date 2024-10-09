<#--<#import "template.ftl" as layout>-->
<#--<@layout.registrationLayout displayMessage=!messagesPerField.existsError('username','password') displayInfo=realm.password && realm.registrationAllowed && !registrationDisabled??; section>-->
<#--    <#if section = "header">-->
<#--    <#elseif section = "form">-->
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8"/>
    <title>OpenSlides</title>
    <base href="/"/>
    <meta content="width=device-width, initial-scale=1" name="viewport"/>
    <meta content="noindex" name="robots"/>
    <meta content="notranslate" name="google"/>
    <link href="assets/img/favicon.png" rel="icon" type="image/x-icon"/>
    <meta content="IE=edge" http-equiv="X-UA-Compatible"/>
    <link href="manifest.webmanifest" rel="manifest"/>
    <meta content="#1976d2" name="theme-color"/>
    <link rel="stylesheet" href="/styles.css">
</head>
<body class="openslides-light-theme">
<os-root></os-root>
<noscript>Please enable JavaScript to continue using this application.</noscript>
<script id="keycloak-config">
    const keycloakLoginConfig = {};
    keycloakLoginConfig.bootAsKeycloakPage = true;
    keycloakLoginConfig.jumpToRoute = 'login';
    keycloakLoginConfig.loginAction = '${url.loginAction}';
    const fieldErrors = {};

    <#if messagesPerField.existsError('password')>
        fieldErrors.password = '${kcSanitize(messagesPerField.getFirstError('password'))?no_esc}';
    </#if>
    <#if messagesPerField.existsError('username')>
        fieldErrors.username = '${kcSanitize(messagesPerField.getFirstError('username'))?no_esc}';
    </#if>
    keycloakLoginConfig.fieldErrors = fieldErrors;
    window.keycloakLoginConfig = keycloakLoginConfig;
</script>
<script src="/polyfills.js" type="module"></script>
<script src="/scripts.js" defer></script>
<script src="/main.js" type="module"></script>
</body>
</html>
<#--    <#elseif section = "info" >-->
<#--    <#elseif section = "socialProviders" >-->
<#--    </#if>-->
<#--</@layout.registrationLayout>-->
