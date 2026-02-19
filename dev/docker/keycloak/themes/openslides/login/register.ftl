<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('firstName','lastName','email','username','password','password-confirm') ; section>
    <#if section = "form">
        <h1 id="kc-page-title">${msg("registerTitle")}</h1>
        <form id="kc-register-form" action="${url.registrationAction}" method="post">
            <div>
                <label for="firstName">${msg("firstName")}</label>
                <input type="text" id="firstName" name="firstName" value="${(register.formData.firstName!'')}" autocomplete="given-name" />
                <#if messagesPerField.existsError('firstName')>
                    <span class="os-alert os-alert-error" style="display:block;margin-top:4px">${kcSanitize(messagesPerField.getFirstError('firstName'))?no_esc}</span>
                </#if>
            </div>

            <div>
                <label for="lastName">${msg("lastName")}</label>
                <input type="text" id="lastName" name="lastName" value="${(register.formData.lastName!'')}" autocomplete="family-name" />
                <#if messagesPerField.existsError('lastName')>
                    <span class="os-alert os-alert-error" style="display:block;margin-top:4px">${kcSanitize(messagesPerField.getFirstError('lastName'))?no_esc}</span>
                </#if>
            </div>

            <div>
                <label for="email">${msg("email")}</label>
                <input type="email" id="email" name="email" value="${(register.formData.email!'')}" autocomplete="email" />
                <#if messagesPerField.existsError('email')>
                    <span class="os-alert os-alert-error" style="display:block;margin-top:4px">${kcSanitize(messagesPerField.getFirstError('email'))?no_esc}</span>
                </#if>
            </div>

            <#if !realm.registrationEmailAsUsername>
                <div>
                    <label for="username">${msg("username")}</label>
                    <input type="text" id="username" name="username" value="${(register.formData.username!'')}" autocomplete="username" />
                    <#if messagesPerField.existsError('username')>
                        <span class="os-alert os-alert-error" style="display:block;margin-top:4px">${kcSanitize(messagesPerField.getFirstError('username'))?no_esc}</span>
                    </#if>
                </div>
            </#if>

            <#if passwordRequired??>
                <div>
                    <label for="password">${msg("password")}</label>
                    <input type="password" id="password" name="password" autocomplete="new-password" />
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
            </#if>

            <#if recaptchaRequired??>
                <div>
                    <div class="g-recaptcha" data-size="compact" data-sitekey="${recaptchaSiteKey}"></div>
                </div>
            </#if>

            <input type="submit" value="${msg("doRegister")}" />
        </form>
        <a class="os-back-link" href="${url.loginUrl}">&laquo; ${msg("backToLogin")}</a>
    </#if>
</@layout.registrationLayout>
