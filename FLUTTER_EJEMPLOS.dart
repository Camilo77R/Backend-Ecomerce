/**
 * 📱 EJEMPLOS DE USO EN FLUTTER
 */

// ========== PANTALLA DE REGISTRO ==========
class RegistroScreen extends StatefulWidget {
  @override
  State<RegistroScreen> createState() => _RegistroScreenState();
}

class _RegistroScreenState extends State<RegistroScreen> {
  final nombreController = TextEditingController();
  final emailController = TextEditingController();
  final passwordController = TextEditingController();
  final confirmPasswordController = TextEditingController();
  bool isLoading = false;

  void _registrar() async {
    if (passwordController.text != confirmPasswordController.text) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Las contraseñas no coinciden')),
      );
      return;
    }

    setState(() => isLoading = true);

    final result = await AuthService.register(
      nombre: nombreController.text,
      email: emailController.text,
      password: passwordController.text,
    );

    setState(() => isLoading = false);

    if (result['success']) {
      // ✅ Registro exitoso, ir a home o siguiente pantalla
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('¡Registro exitoso!')),
      );
      Navigator.of(context).pushReplacementNamed('/home');
    } else {
      // ❌ Error en registro
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: ${result['error']}')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Registro')),
      body: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          children: [
            TextField(
              controller: nombreController,
              decoration: InputDecoration(labelText: 'Nombre Completo'),
            ),
            TextField(
              controller: emailController,
              decoration: InputDecoration(labelText: 'Email'),
              keyboardType: TextInputType.emailAddress,
            ),
            TextField(
              controller: passwordController,
              decoration: InputDecoration(labelText: 'Contraseña'),
              obscureText: true,
            ),
            TextField(
              controller: confirmPasswordController,
              decoration: InputDecoration(labelText: 'Confirmar Contraseña'),
              obscureText: true,
            ),
            SizedBox(height: 20),
            ElevatedButton(
              onPressed: isLoading ? null : _registrar,
              child: isLoading
                  ? CircularProgressIndicator()
                  : Text('Registrarse'),
            ),
          ],
        ),
      ),
    );
  }
}

// ========== PANTALLA DE LOGIN ==========
class LoginScreen extends StatefulWidget {
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final emailController = TextEditingController();
  final passwordController = TextEditingController();
  bool isLoading = false;

  void _login() async {
    setState(() => isLoading = true);

    final result = await AuthService.login(
      email: emailController.text,
      password: passwordController.text,
    );

    setState(() => isLoading = false);

    if (result['success']) {
      // ✅ Login exitoso
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('¡Bienvenido!')),
      );
      Navigator.of(context).pushReplacementNamed('/home');
    } else {
      // ❌ Error en login
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: ${result['error']}')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Iniciar Sesión')),
      body: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          children: [
            TextField(
              controller: emailController,
              decoration: InputDecoration(labelText: 'Email'),
              keyboardType: TextInputType.emailAddress,
            ),
            TextField(
              controller: passwordController,
              decoration: InputDecoration(labelText: 'Contraseña'),
              obscureText: true,
            ),
            SizedBox(height: 20),
            ElevatedButton(
              onPressed: isLoading ? null : _login,
              child: isLoading
                  ? CircularProgressIndicator()
                  : Text('Iniciar Sesión'),
            ),
          ],
        ),
      ),
    );
  }
}

// ========== PANTALLA DE PERFIL (CORRECTA) ==========
class PerfilScreen extends StatefulWidget {
  @override
  State<PerfilScreen> createState() => _PerfilScreenState();
}

class _PerfilScreenState extends State<PerfilScreen> {
  String? nombre = 'Cargando...';
  String? email = 'Cargando...';
  String? gender = 'No especificado';
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _cargarDatos();
  }

  void _cargarDatos() async {
    // ✅ Obtener datos guardados localmente (SIN hacer request)
    final usuarioLocal = await AuthService.getUserDataLocal();
    
    if (usuarioLocal != null) {
      setState(() {
        nombre = usuarioLocal['name'] ?? 'Sin nombre';
        email = usuarioLocal['email'] ?? 'Sin email';
        gender = usuarioLocal['gender'] ?? 'No especificado';
        isLoading = false;
      });
    } else {
      // Si no hay datos locales, hacer request
      final result = await AuthService.getProfile();
      
      if (result['success']) {
        final usuario = result['usuario'];
        setState(() {
          nombre = usuario['name'] ?? 'Sin nombre';
          email = usuario['email'] ?? 'Sin email';
          gender = usuario['gender'] ?? 'No especificado';
          isLoading = false;
        });
      } else {
        setState(() {
          nombre = 'Error';
          email = result['error'];
          isLoading = false;
        });
      }
    }
  }

  void _cerrarSesion() async {
    await AuthService.logout();
    // Ir a pantalla de login
    Navigator.of(context).pushReplacementNamed('/login');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Mi Perfil'),
        actions: [
          IconButton(
            icon: Icon(Icons.logout),
            onPressed: _cerrarSesion,
          ),
        ],
      ),
      body: isLoading
          ? Center(child: CircularProgressIndicator())
          : Padding(
              padding: EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // ✅ AQUÍ ESTÁN LOS DATOS REALES (no hardcodeados)
                  Text(
                    'Nombre: $nombre',
                    style: TextStyle(fontSize: 18),
                  ),
                  SizedBox(height: 10),
                  Text(
                    'Email: $email',
                    style: TextStyle(fontSize: 18),
                  ),
                  SizedBox(height: 10),
                  Text(
                    'Género: $gender',
                    style: TextStyle(fontSize: 18),
                  ),
                  SizedBox(height: 30),
                  ElevatedButton(
                    onPressed: () => Navigator.pushNamed(context, '/editar-perfil'),
                    child: Text('Editar Perfil'),
                  ),
                ],
              ),
            ),
    );
  }
}
