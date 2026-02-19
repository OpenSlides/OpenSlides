<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('username','password') ; section>
    <#if section = "form">
        <h1 id="kc-page-title">${msg("loginAccountTitle")}</h1>
        <form id="kc-form-login" action="${url.loginAction}" method="post">
            <div>
                <label for="username">
                    <#if !realm.loginWithEmailAllowed>${msg("username")}<#elseif !realm.registrationEmailAsUsername>${msg("usernameOrEmail")}<#else>${msg("email")}</#if>
                </label>
                <input tabindex="1" id="username" name="username" value="${(login.username!'')}" type="text" autofocus autocomplete="username" />
                <#if messagesPerField.existsError('username')>
                    <span class="os-alert os-alert-error" style="display:block;margin-top:4px">${kcSanitize(messagesPerField.getFirstError('username'))?no_esc}</span>
                </#if>
            </div>
            <div>
                <label for="password">${msg("password")}</label>
                <input tabindex="2" id="password" name="password" type="password" autocomplete="current-password" />
                <#if messagesPerField.existsError('password')>
                    <span class="os-alert os-alert-error" style="display:block;margin-top:4px">${kcSanitize(messagesPerField.getFirstError('password'))?no_esc}</span>
                </#if>
            </div>

            <#if realm.rememberMe && !usernameHidden??>
                <div style="margin-top:8px">
                    <label>
                        <input tabindex="3" id="rememberMe" name="rememberMe" type="checkbox" <#if login.rememberMe??>checked</#if>> ${msg("rememberMe")}
                    </label>
                </div>
            </#if>

            <input tabindex="4" type="submit" id="kc-login" value="${msg("doLogIn")}" />

            <#if realm.resetPasswordAllowed>
                <div id="kc-form-options">
                    <a tabindex="5" href="${url.loginResetCredentialsUrl}">${msg("doForgotPassword")}</a>
                </div>
            </#if>
        </form>

        <#if realm.password && social.providers??>
            <div id="kc-social-providers" style="margin-top:24px;text-align:center">
                <hr style="margin-bottom:16px" />
                <#list social.providers as p>
                    <a href="${p.loginUrl}" id="social-${p.alias}" style="display:block;margin-bottom:8px">
                        ${p.displayName!}
                    </a>
                </#list>
            </div>
        </#if>

        <#if realm.registrationAllowed && !registrationDisabled??>
            <div style="margin-top:16px;text-align:center">
                <span>${msg("noAccount")}</span>
                <a href="${url.registrationUrl}">${msg("doRegister")}</a>
            </div>
        </#if>
    </#if>
</@layout.registrationLayout>
