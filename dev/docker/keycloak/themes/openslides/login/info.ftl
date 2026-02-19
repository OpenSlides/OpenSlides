<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=false ; section>
    <#if section = "form">
        <#if messageHeader??>
            <h1 id="kc-page-title">${kcSanitize(messageHeader)?no_esc}</h1>
        <#else>
            <h1 id="kc-page-title">${message.summary}</h1>
        </#if>

        <#if message?has_content && message.type != 'warning'>
            <div class="os-alert os-alert-${message.type}">
                ${kcSanitize(message.summary)?no_esc}
            </div>
        </#if>

        <#if requiredActions??>
            <p>
                <#list requiredActions as reqAction>
                    ${kcSanitize(msg("requiredAction.${reqAction}"))?no_esc}
                    <#sep>, </#sep>
                </#list>
            </p>
        </#if>

        <#if skipLink??>
        <#else>
            <#if pageRedirectUri?has_content>
                <a class="os-back-link" href="${pageRedirectUri}">${kcSanitize(msg("backToApplication"))?no_esc}</a>
            <#elseif actionUri?has_content>
                <a class="os-back-link" href="${actionUri}">${kcSanitize(msg("proceedWithAction"))?no_esc}</a>
            <#elseif (client.baseUrl)?has_content>
                <a class="os-back-link" href="${client.baseUrl}">${kcSanitize(msg("backToApplication"))?no_esc}</a>
            </#if>
        </#if>
    </#if>
</@layout.registrationLayout>
