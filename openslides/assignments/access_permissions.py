
class AccessPermissions:
    def get_serializer_class(self, user):
        """
        Returns different serializer classes according to users permissions.
        """
        from openslides.assignments.serializers import AssignmentFullSerializer, AssignmentShortSerializer
        if user.has_perm('assignments.can_manage'):
            serializer_class = AssignmentFullSerializer
        else:
            serializer_class = AssignmentShortSerializer
        return serializer_class

    def can_retrieve(self, user):
        """
        TODO
        """
        return user.has_perm('agenda.can_see')
