<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=false ; section>
    <#if section = "form">
        <h1 id="kc-page-title">${msg("errorTitle")}</h1>
        <#if message?has_content>
            <div class="os-alert os-alert-error">
                ${kcSanitize(message.summary)?no_esc}
            </div>
        </#if>
        <#if skipLink??>
        <#else>
            <#if client?? && client.baseUrl?has_content>
                <a class="os-back-link" href="${client.baseUrl}">${kcSanitize(msg("backToApplication"))?no_esc}</a>
            </#if>
        </#if>
    </#if>
</@layout.registrationLayout>
