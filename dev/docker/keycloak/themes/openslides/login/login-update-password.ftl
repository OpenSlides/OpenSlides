<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('password','password-confirm') ; section>
    <#if section = "form">
        <h1 id="kc-page-title">${msg("updatePasswordTitle")}</h1>
        <form id="kc-passwd-update-form" action="${url.loginAction}" method="post">
            <input type="text" id="username" name="username" value="${username}" autocomplete="username" readonly="readonly" style="display:none;" />
            <input type="password" id="password" name="password" autocomplete="current-password" style="display:none;" />

            <div>
                <label for="password-new">${msg("passwordNew")}</label>
                <input type="password" id="password-new" name="password-new" autofocus autocomplete="new-password" />
                <#if messagesPerField.existsError('password')>
                    <span class="os-alert os-alert-error" style="display:block;margin-top:4px">${kcSanitize(messagesPerField.getFirstError('password'))?no_esc}</span>
                </#if>
            </div>

            <div>
                <label for="password-confirm">${msg("passwordConfirm")}</label>
                <input type="password" id="password-confirm" name="password-confirm" autocomplete="new-password" />
                <#if messagesPerField.existsError('password-confirm')>
                    <span class="os-alert os-alert-error" style="display:block;margin-top:4px">${kcSanitize(messagesPerField.getFirstError('password-confirm'))?no_esc}</span>
                </#if>
            </div>

            <#if isAppInitiatedAction??>
                <input type="submit" value="${msg("doSubmit")}" />
                <button type="submit" name="cancel-aia" value="true">${msg("doCancel")}</button>
            <#else>
                <input type="submit" value="${msg("doSubmit")}" />
            </#if>
        </form>
    </#if>
</@layout.registrationLayout>
