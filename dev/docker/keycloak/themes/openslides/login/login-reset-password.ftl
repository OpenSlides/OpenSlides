<#import "template.ftl" as layout>
<@layout.registrationLayout displayInfo=true displayMessage=!messagesPerField.existsError('username') ; section>
    <#if section = "form">
        <h1 id="kc-page-title">${msg("emailForgotTitle")}</h1>
        <form id="kc-reset-password-form" action="${url.loginAction}" method="post">
            <div>
                <label for="username">
                    <#if !realm.loginWithEmailAllowed>${msg("username")}<#elseif !realm.registrationEmailAsUsername>${msg("usernameOrEmail")}<#else>${msg("email")}</#if>
                </label>
                <input type="text" id="username" name="username" autofocus autocomplete="username"
                       value="${(auth.attemptedUsername!'')}" />
                <#if messagesPerField.existsError('username')>
                    <span class="os-alert os-alert-error" style="display:block;margin-top:4px">${kcSanitize(messagesPerField.getFirstError('username'))?no_esc}</span>
                </#if>
            </div>
            <input type="submit" value="${msg("doSubmit")}" />
        </form>
        <a class="os-back-link" href="${url.loginUrl}">&laquo; ${msg("backToLogin")}</a>
    <#elseif section = "info">
        <p>${msg("emailInstruction")}</p>
    </#if>
</@layout.registrationLayout>
